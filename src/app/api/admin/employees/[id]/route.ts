import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { assignPathsForPosition } from "@/lib/assignPaths";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import { validatePassword } from "@/lib/password-policy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const { data: employee } = await db
    .from("User")
    .select("id, email, firstName, lastName, role, position, location, phone, hireDate, isActive, skipReviewTimer, mustResetPassword, createdAt")
    .eq("id", id)
    .single();

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch related data separately
  const [
    { data: assignments },
    { data: completions },
    { data: quizAttempts },
    { data: trainingPaths },
  ] = await Promise.all([
    db.from("ModuleAssignment").select("*, module:Module(*, section:Section(*))").eq("userId", id),
    db.from("ModuleCompletion").select("*, module:Module(*)").eq("userId", id),
    db.from("QuizAttempt").select("*, quiz:Quiz(*)").eq("userId", id).order("completedAt", { ascending: false }),
    db.from("UserTrainingPath").select("*, trainingPath:TrainingPath(*)").eq("userId", id),
  ]);

  const currentAssignments = (assignments || []).filter((assignment: any) =>
    assignment.isActive && assignment.module?.isActive && assignment.module?.section?.isActive,
  );
  const currentAssignmentIds = new Set(
    currentAssignments.map((assignment: any) => assignment.moduleId),
  );
  const currentCompletions = (completions || []).filter((completion: any) =>
    completion.module?.isActive && currentAssignmentIds.has(completion.moduleId),
  );
  const currentQuizAttempts = (quizAttempts || []).filter((attempt: any) => {
    const quiz = attempt.quiz;
    if (!quiz) return false;
    if (quiz.moduleId) return currentAssignmentIds.has(quiz.moduleId);
    return false;
  });
  const currentTrainingPaths = (trainingPaths || []).filter(
    (link: any) => link.isActive && link.trainingPath?.isActive,
  );

  return NextResponse.json({
    ...employee,
    assignments: currentAssignments,
    completions: currentCompletions,
    quizAttempts: currentQuizAttempts,
    trainingPaths: currentTrainingPaths,
    archivedHistory: {
      assignments: (assignments || []).length - currentAssignments.length,
      completions: (completions || []).length - currentCompletions.length,
      quizAttempts: (quizAttempts || []).length - currentQuizAttempts.length,
      trainingPaths: (trainingPaths || []).length - currentTrainingPaths.length,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;
  const adminUser = auth.user;

  const { id } = await params;
  const data = await request.json();

  const { data: priorUser } = await db
    .from("User")
    .select("authId, role, position, hireDate, isActive")
    .eq("id", id)
    .single();

  if (!priorUser) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if (priorUser.role === "SUPER_ADMIN" && adminUser.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only a super admin can modify a super admin account" },
      { status: 403 },
    );
  }

  if (
    data.role &&
    adminUser.role !== "SUPER_ADMIN" &&
    ["SUPER_ADMIN", "ADMIN"].includes(data.role)
  ) {
    return NextResponse.json(
      { error: "Only a super admin can grant an admin role" },
      { status: 403 },
    );
  }

  if (data.isActive === false && id === adminUser.id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account" },
      { status: 400 },
    );
  }

  if (data.password !== undefined) {
    const passwordError = validatePassword(data.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    if (!priorUser.authId) {
      return NextResponse.json(
        { error: "This employee does not have a linked login account" },
        { status: 409 },
      );
    }

    // Set the gate before touching Supabase Auth. If either the Auth update or
    // a later profile update fails, the temporary credential can never unlock
    // the rest of the application without the employee replacing it.
    const { error: resetGateError } = await db
      .from("User")
      .update({ mustResetPassword: true })
      .eq("id", id);
    if (resetGateError) {
      return NextResponse.json(
        { error: "Unable to require a password reset" },
        { status: 500 },
      );
    }
  }

  if (priorUser.authId && (data.password || data.email || data.isActive !== undefined)) {
    const supabaseAdmin = await createAdminClient();
    const authUpdate: {
      password?: string;
      email?: string;
      email_confirm?: boolean;
      ban_duration?: string;
    } = {};
    if (data.password) authUpdate.password = data.password;
    if (data.email) {
      authUpdate.email = data.email.trim().toLowerCase();
      authUpdate.email_confirm = true;
    }
    if (data.isActive !== undefined) {
      authUpdate.ban_duration = data.isActive ? "none" : "876000h";
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      priorUser.authId,
      authUpdate,
    );
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  }

  const updateData: any = {};
  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.email) updateData.email = data.email.trim().toLowerCase();
  if (data.role) updateData.role = data.role;
  if (data.position !== undefined) updateData.position = data.position || null;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.skipReviewTimer !== undefined) updateData.skipReviewTimer = !!data.skipReviewTimer;
  if (data.password !== undefined) updateData.mustResetPassword = true;

  const { data: updatedUser, error } = await db
    .from("User")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Synchronize controlled position paths when the employee changes jobs or
  // returns from inactive status. The RPC removes obsolete auto-assigned paths
  // but deliberately preserves every manual manager assignment.
  if (
    updatedUser.isActive &&
    (
      (data.position !== undefined &&
        (updatedUser.position ?? null) !== (priorUser?.position ?? null)) ||
      (data.isActive === true && priorUser.isActive === false)
    )
  ) {
    try {
      await assignPathsForPosition(
        updatedUser.id,
        updatedUser.position,
        updatedUser.hireDate ?? priorUser?.hireDate ?? null,
        adminUser.id,
      );
    } catch (assignmentError) {
      return NextResponse.json(
        {
          error:
            assignmentError instanceof Error
              ? assignmentError.message
              : "Employee saved, but training paths could not be synchronized",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ id: updatedUser.id, email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(["SUPER_ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account" },
      { status: 400 },
    );
  }

  const { data: target } = await db
    .from("User")
    .select("authId")
    .eq("id", id)
    .single();

  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await db.from("User").update({ isActive: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (target.authId) {
    const supabaseAdmin = await createAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(target.authId, {
      ban_duration: "876000h",
    });
  }
  return NextResponse.json({ success: true });
}
