import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import { CURRICULUM_PROGRAMS } from "@/lib/curriculum";

const CHECKS = ["standard", "safety", "live"] as const;
const STATUSES = new Set(["PASSED", "NEEDS_COACHING", "REVOKED"]);

export async function GET() {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const [usersResult, modulesResult, signoffsResult] = await Promise.all([
    db.from("User").select("id, firstName, lastName, position, location").eq("isActive", true).order("lastName"),
    db.from("Module").select("id, title, tags, section:Section(title)").eq("isActive", true).contains("tags", ["practical-required"]).order("title"),
    db.from("PracticalSignoff").select("*, user:User!PracticalSignoff_userId_fkey(firstName, lastName, position), module:Module(title, section:Section(title)), verifier:User!PracticalSignoff_verifiedById_fkey(firstName, lastName)").order("updatedAt", { ascending: false }),
  ]);

  const error = usersResult.error || modulesResult.error || signoffsResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    users: usersResult.data || [],
    modules: modulesResult.data || [],
    signoffs: signoffsResult.data || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const moduleId = typeof body?.moduleId === "string" ? body.moduleId : "";
  const status = typeof body?.status === "string" ? body.status : "";
  const evidence = typeof body?.evidence === "string" ? body.evidence.trim().slice(0, 2_000) : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2_000) : "";
  const criticalChecks = Array.isArray(body?.criticalChecks)
    ? Array.from(new Set(body.criticalChecks.filter((value: unknown): value is string => CHECKS.includes(value as (typeof CHECKS)[number]))))
    : [];

  if (!userId || !moduleId || !STATUSES.has(status)) {
    return NextResponse.json({ error: "Employee, practical module, and valid status are required" }, { status: 400 });
  }
  if (status === "PASSED" && (evidence.length < 12 || !CHECKS.every((check) => criticalChecks.includes(check)))) {
    return NextResponse.json({ error: "A pass requires floor evidence and all critical checks" }, { status: 400 });
  }

  // Revocation is intentionally available even after an employee, assignment,
  // or module becomes inactive. The locked RPC requires an existing current
  // passed cycle and appends the revocation to that exact audit history.
  if (status === "REVOKED") {
    if (notes.length < 3) {
      return NextResponse.json({ error: "Revocation notes are required" }, { status: 400 });
    }
    const { data, error } = await db.rpc("record_practical_signoff_atomic", {
      p_user_id: userId,
      p_module_id: moduleId,
      p_status: status,
      p_verified_by_id: auth.user.id,
      p_evidence: evidence,
      p_critical_checks: criticalChecks,
      p_notes: notes,
      p_audit_schedule_days: [],
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  }

  const [{ data: employee }, { data: trainingModule }, { data: assignment }, { data: completion }, requiredQuizzesResult] = await Promise.all([
    db.from("User").select("id").eq("id", userId).eq("isActive", true).single(),
    db.from("Module").select("id, tags, section:Section(isActive, slug)").eq("id", moduleId).eq("isActive", true).single(),
    db.from("ModuleAssignment").select("id").eq("userId", userId).eq("moduleId", moduleId).eq("isActive", true).maybeSingle(),
    db.from("ModuleCompletion").select("id").eq("userId", userId).eq("moduleId", moduleId).maybeSingle(),
    db.from("Quiz").select("id").eq("moduleId", moduleId).eq("isRequired", true),
  ]);
  const parentSection = trainingModule?.section as unknown as {
    isActive?: boolean;
    slug?: string;
  } | null;
  if (
    !employee ||
    !trainingModule ||
    !parentSection?.isActive ||
    !(trainingModule.tags || []).includes("practical-required")
  ) {
    return NextResponse.json({ error: "Employee or practical module is no longer eligible" }, { status: 400 });
  }
  if (!assignment || !completion) {
    return NextResponse.json({ error: "The employee must be assigned and finish the lesson review before practical certification" }, { status: 400 });
  }
  if (requiredQuizzesResult.error) {
    return NextResponse.json({ error: "Required knowledge checks could not be verified" }, { status: 503 });
  }
  const requiredQuizIds = (requiredQuizzesResult.data || []).map((quiz) => quiz.id);
  if (requiredQuizIds.length > 0) {
    const { data: passedAttempts, error: attemptsError } = await db
      .from("QuizAttempt")
      .select("quizId")
      .eq("userId", userId)
      .eq("passed", true)
      .in("quizId", requiredQuizIds);
    if (attemptsError) {
      return NextResponse.json({ error: "Required knowledge checks could not be verified" }, { status: 503 });
    }
    const passedQuizIds = new Set((passedAttempts || []).map((attempt) => attempt.quizId));
    if (requiredQuizIds.some((quizId) => !passedQuizIds.has(quizId))) {
      return NextResponse.json({ error: "Every required knowledge check must be passed before practical certification" }, { status: 400 });
    }
  }

  const auditScheduleDays = [
    ...(CURRICULUM_PROGRAMS.find(
      (program) => program.slug === parentSection.slug,
    )?.certification?.auditDays || []),
  ];
  if (status === "PASSED" && auditScheduleDays.length === 0) {
    return NextResponse.json(
      { error: "This practical has no controlled audit schedule" },
      { status: 409 },
    );
  }
  const { data, error } = await db.rpc("record_practical_signoff_atomic", {
    p_user_id: userId,
    p_module_id: moduleId,
    p_status: status,
    p_verified_by_id: auth.user.id,
    p_evidence: evidence,
    p_critical_checks: criticalChecks,
    p_notes: notes,
    p_audit_schedule_days: auditScheduleDays,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const result = body?.result === "PASSED" ? "PASSED" : body?.result === "NEEDS_COACHING" ? "NEEDS_COACHING" : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2_000) : "";
  if (!id || !result || notes.length < 3) {
    return NextResponse.json(
      { error: "Signoff, audit result, and observation notes are required" },
      { status: 400 },
    );
  }

  const { data, error } = await db.rpc("record_practical_audit_atomic", {
    p_signoff_id: id,
    p_result: result,
    p_verified_by_id: auth.user.id,
    p_notes: notes,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}
