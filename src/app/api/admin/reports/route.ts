import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

const pairKey = (userId: string, moduleId: string) => `${userId}:${moduleId}`;

async function loadReportData() {
  const [usersResult, modulesResult, assignmentsResult, completionsResult, quizAttemptsResult] = await Promise.all([
    db.from("User").select("id, firstName, lastName, role, location, isActive"),
    db.from("Module").select("id, isActive"),
    db.from("ModuleAssignment").select("id, userId, moduleId, dueDate, user:User(firstName, lastName), module:Module(title)").eq("isActive", true),
    db.from("ModuleCompletion").select("userId, moduleId"),
    db.from("QuizAttempt").select("userId, score, passed, quiz:Quiz(moduleId)"),
  ]);
  const error = usersResult.error || modulesResult.error || assignmentsResult.error || completionsResult.error || quizAttemptsResult.error;
  if (error) throw new Error(error.message);

  const users = usersResult.data || [];
  const activeUsers = users.filter((user: any) => user.isActive);
  const activeUserIds = new Set(activeUsers.map((user: any) => user.id));
  const activeModules = (modulesResult.data || []).filter((trainingModule: any) => trainingModule.isActive);
  const activeModuleIds = new Set(activeModules.map((trainingModule: any) => trainingModule.id));
  const assignmentMap = new Map<string, any>();
  for (const assignment of assignmentsResult.data || []) {
    if (!activeUserIds.has(assignment.userId) || !activeModuleIds.has(assignment.moduleId)) continue;
    assignmentMap.set(pairKey(assignment.userId, assignment.moduleId), assignment);
  }
  const completionKeys = new Set(
    (completionsResult.data || [])
      .map((completion: any) => pairKey(completion.userId, completion.moduleId))
      .filter((key: string) => assignmentMap.has(key)),
  );
  const quizAttempts = (quizAttemptsResult.data || []).filter((attempt: any) =>
    activeUserIds.has(attempt.userId) && attempt.quiz?.moduleId && activeModuleIds.has(attempt.quiz.moduleId),
  );
  return { users, activeUsers, activeModules, assignments: Array.from(assignmentMap.values()), completionKeys, quizAttempts };
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const type = request.nextUrl.searchParams.get("type") || "overview";
  let report;
  try {
    report = await loadReportData();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Report query failed" }, { status: 500 });
  }

  if (type === "overview") {
    const avgScore = report.quizAttempts.length ? Math.round(report.quizAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / report.quizAttempts.length) : 0;
    const passRate = report.quizAttempts.length ? Math.round((report.quizAttempts.filter((attempt: any) => attempt.passed).length / report.quizAttempts.length) * 100) : 0;
    return NextResponse.json({
      totalUsers: report.users.length,
      activeUsers: report.activeUsers.length,
      totalModules: report.activeModules.length,
      totalAssignments: report.assignments.length,
      totalCompletions: report.completionKeys.size,
      completionRate: report.assignments.length ? Math.round((report.completionKeys.size / report.assignments.length) * 100) : 0,
      avgQuizScore: avgScore,
      passRate,
    });
  }

  if (type === "employees") {
    return NextResponse.json(report.activeUsers.map((user: any) => {
      const assignments = report.assignments.filter((assignment: any) => assignment.userId === user.id);
      const completed = assignments.filter((assignment: any) => report.completionKeys.has(pairKey(user.id, assignment.moduleId))).length;
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        location: user.location,
        assigned: assignments.length,
        completed,
        completionPercent: assignments.length ? Math.round((completed / assignments.length) * 100) : 0,
      };
    }));
  }

  if (type === "overdue") {
    const now = Date.now();
    return NextResponse.json(report.assignments
      .filter((assignment: any) => assignment.dueDate && new Date(assignment.dueDate).valueOf() < now && !report.completionKeys.has(pairKey(assignment.userId, assignment.moduleId)))
      .map((assignment: any) => ({
        id: assignment.id,
        employeeName: `${assignment.user?.firstName || ""} ${assignment.user?.lastName || ""}`.trim(),
        moduleName: assignment.module?.title || "Training module",
        dueDate: assignment.dueDate,
      })));
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
