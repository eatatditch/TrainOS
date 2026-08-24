import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { assignTrainingPathToUser, setUserPositions } from "@/lib/assignPaths";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import { validatePassword } from "@/lib/password-policy";
import { isPosition, normalizePositions } from "@/lib/positions";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const role = request.nextUrl.searchParams.get("role");
  const location = request.nextUrl.searchParams.get("location");

  const position = request.nextUrl.searchParams.get("position");

  let query = db
    .from("User")
    .select("id, email, firstName, lastName, role, position, location, phone, hireDate, isActive, skipReviewTimer, mustResetPassword, createdAt")
    .order("lastName");

  if (role) query = query.eq("role", role);
  if (location) query = query.eq("location", location);

  const { data: users, error: usersError } = await query;
  if (usersError) {
    return NextResponse.json({ error: "Unable to load employees" }, { status: 500 });
  }
  const userIds = (users || []).map((user) => user.id);
  if (userIds.length === 0) return NextResponse.json([]);

  // One current-curriculum snapshot replaces the previous per-user N+1 query.
  // Legacy completions and path links remain in the database for history, but
  // never inflate the active scorecard or surface as assignable path chips.
  const [assignmentsResult, completionsResult, pathsResult, positionsResult] = await Promise.all([
    db
      .from("ModuleAssignment")
      .select("userId, moduleId, module:Module(isActive, section:Section(isActive))")
      .in("userId", userIds)
      .eq("isActive", true),
    db
      .from("ModuleCompletion")
      .select("userId, moduleId, module:Module(isActive, section:Section(isActive))")
      .in("userId", userIds),
    db
      .from("UserTrainingPath")
      .select("userId, trainingPath:TrainingPath(id, title, isActive)")
      .in("userId", userIds)
      .eq("isActive", true),
    db
      .from("UserPosition")
      .select("userId, position, isPrimary")
      .in("userId", userIds)
      .eq("isActive", true)
      .order("isPrimary", { ascending: false })
      .order("position", { ascending: true }),
  ]);
  const relatedError = assignmentsResult.error || completionsResult.error || pathsResult.error || positionsResult.error;
  if (relatedError) {
    return NextResponse.json({ error: "Unable to load current training progress" }, { status: 500 });
  }

  const activeAssignments = (assignmentsResult.data || []).filter((assignment) => {
    const trainingModule = assignment.module as unknown as {
      isActive?: boolean;
      section?: { isActive?: boolean } | null;
    } | null;
    return trainingModule?.isActive && trainingModule.section?.isActive;
  });
  const assignmentPairs = new Set(
    activeAssignments.map((assignment) => `${assignment.userId}:${assignment.moduleId}`),
  );
  const activeCompletions = (completionsResult.data || []).filter((completion) => {
    const trainingModule = completion.module as unknown as {
      isActive?: boolean;
      section?: { isActive?: boolean } | null;
    } | null;
    return (
      trainingModule?.isActive &&
      trainingModule.section?.isActive &&
      assignmentPairs.has(`${completion.userId}:${completion.moduleId}`)
    );
  });

  const assignmentCounts = new Map<string, number>();
  const completionCounts = new Map<string, number>();
  for (const assignment of activeAssignments) {
    assignmentCounts.set(assignment.userId, (assignmentCounts.get(assignment.userId) || 0) + 1);
  }
  for (const completion of activeCompletions) {
    completionCounts.set(completion.userId, (completionCounts.get(completion.userId) || 0) + 1);
  }
  const pathsByUser = new Map<string, Array<{ id: string; title: string }>>();
  for (const link of pathsResult.data || []) {
    const trainingPath = link.trainingPath as unknown as {
      id?: string;
      title?: string;
      isActive?: boolean;
    } | null;
    if (!trainingPath?.isActive || !trainingPath.id || !trainingPath.title) continue;
    const paths = pathsByUser.get(link.userId) || [];
    if (!paths.some((path) => path.id === trainingPath.id)) {
      paths.push({ id: trainingPath.id, title: trainingPath.title });
      pathsByUser.set(link.userId, paths);
    }
  }

  const positionsByUser = new Map<string, string[]>();
  for (const row of positionsResult.data || []) {
    const positions = positionsByUser.get(row.userId) || [];
    if (!positions.includes(row.position)) positions.push(row.position);
    positionsByUser.set(row.userId, positions);
  }

  const usersWithData = (users || [])
    .map((user) => {
      const positions = positionsByUser.get(user.id) ||
        (isPosition(user.position) ? [user.position] : []);
      return {
        ...user,
        position: positions[0] || null,
        positions,
        _count: {
          assignments: assignmentCounts.get(user.id) || 0,
          completions: completionCounts.get(user.id) || 0,
        },
        trainingPaths: pathsByUser.get(user.id) || [],
      };
    })
    .filter((user) => !position || user.positions.includes(position));

  return NextResponse.json(usersWithData);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;
  const adminUser = auth.user;

  const data = await request.json();
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !data.firstName?.trim() || !data.lastName?.trim()) {
    return NextResponse.json(
      { error: "First name, last name, and email are required" },
      { status: 400 },
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json(
      { error: passwordError },
      { status: 400 },
    );
  }

  const requestedRole = data.role || "EMPLOYEE";
  if (
    adminUser.role !== "SUPER_ADMIN" &&
    ["SUPER_ADMIN", "ADMIN"].includes(requestedRole)
  ) {
    return NextResponse.json(
      { error: "Only a super admin can create an admin account" },
      { status: 403 },
    );
  }


  const rawPositions = data.positions !== undefined
    ? data.positions
    : data.position
      ? [data.position]
      : [];
  if (!Array.isArray(rawPositions) || rawPositions.some((value) => !isPosition(value))) {
    return NextResponse.json(
      { error: "One or more positions is invalid" },
      { status: 400 },
    );
  }
  const requestedPositions = normalizePositions(rawPositions);

  const { data: existing } = await db
    .from("User")
    .select("*")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const supabaseAdmin = await createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { data: newUser, error } = await db
    .from("User")
    .insert({
      authId: authData.user.id,
      email,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: requestedRole,
      position: requestedPositions[0] || null,
      location: data.location || "",
      phone: data.phone || "",
      hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : new Date().toISOString(),
      isActive: true,
      mustResetPassword: true,
    })
    .select()
    .single();

  if (error) {
    // Avoid leaving an orphaned Auth identity when profile creation fails.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep the Auth identity, employee profile, and initial curriculum rollout
  // all-or-nothing from the administrator's perspective. Each database RPC is
  // atomic; deleting a brand-new profile cascades any earlier path links if a
  // later initial assignment fails.
  try {
    if (data.trainingPathIds && data.trainingPathIds.length > 0) {
      const trainingPathIds = Array.from(
        new Set<string>(
          (data.trainingPathIds as unknown[]).filter(
            (value: unknown): value is string => typeof value === "string",
          ),
        ),
      );
      for (const pathId of trainingPathIds) {
        await assignTrainingPathToUser(newUser.id, pathId, adminUser.id, newUser.hireDate, data.dueDate || null);
      }
    }

    // Persist the full job set and fan out all-team plus every matching path.
    await setUserPositions(newUser.id, requestedPositions, adminUser.id);
  } catch (assignmentError) {
    await db.from("User").delete().eq("id", newUser.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: assignmentError instanceof Error ? assignmentError.message : "Training assignment failed" }, { status: 500 });
  }

  return NextResponse.json({
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    positions: requestedPositions,
  });
}
