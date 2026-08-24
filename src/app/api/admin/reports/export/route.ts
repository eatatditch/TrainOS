import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

const pairKey = (userId: string, moduleId: string) => `${userId}:${moduleId}`;
const csvCell = (value: unknown) => {
  let content = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(content)) content = `'${content}`;
  return `"${content.replaceAll('"', '""')}"`;
};

export async function GET() {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const [usersResult, modulesResult, assignmentsResult, completionsResult, attemptsResult] = await Promise.all([
    db.from("User").select("id, email, firstName, lastName, role, location").eq("isActive", true),
    db.from("Module").select("id").eq("isActive", true),
    db.from("ModuleAssignment").select("userId, moduleId").eq("isActive", true),
    db.from("ModuleCompletion").select("userId, moduleId"),
    db.from("QuizAttempt").select("userId, score, assessmentVersion, quiz:Quiz(moduleId, quizType, isActive, assessmentVersion)"),
  ]);
  const error = usersResult.error || modulesResult.error || assignmentsResult.error || completionsResult.error || attemptsResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = usersResult.data || [];
  const activeUserIds = new Set(users.map((user: any) => user.id));
  const activeModuleIds = new Set((modulesResult.data || []).map((trainingModule: any) => trainingModule.id));
  const assignmentKeys = new Set<string>((assignmentsResult.data || [])
    .filter((assignment: any) => activeUserIds.has(assignment.userId) && activeModuleIds.has(assignment.moduleId))
    .map((assignment: any) => pairKey(assignment.userId, assignment.moduleId)));
  const completionKeys = new Set<string>((completionsResult.data || [])
    .map((completion: any) => pairKey(completion.userId, completion.moduleId))
    .filter((key: string) => assignmentKeys.has(key)));

  const rows = users.map((user: any) => {
    const userAssignmentKeys = Array.from(assignmentKeys).filter((key) => key.startsWith(`${user.id}:`));
    const completed = userAssignmentKeys.filter((key) => completionKeys.has(key)).length;
    const attempts = (attemptsResult.data || []).filter((attempt: any) =>
      attempt.userId === user.id &&
      attempt.quiz?.isActive &&
      attempt.assessmentVersion === attempt.quiz.assessmentVersion &&
      (attempt.quiz.quizType !== "MODULE" || activeModuleIds.has(attempt.quiz.moduleId)),
    );
    const avgScore = attempts.length ? Math.round(attempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / attempts.length) : 0;
    return [`${user.firstName} ${user.lastName}`, user.email, user.role, user.location || "", userAssignmentKeys.length, completed, userAssignmentKeys.length ? Math.round((completed / userAssignmentKeys.length) * 100) : 0, avgScore];
  });

  const headers = ["Name", "Email", "Role", "Location", "Assigned", "Completed", "Completion %", "Avg Assessment Score"];
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ditch-training-report.csv",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
