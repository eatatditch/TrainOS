import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") || "overview";

  if (type === "overview") {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalModules },
      { count: totalAssignments },
      { count: completions },
      { data: quizAttempts },
    ] = await Promise.all([
      db.from("User").select("*", { count: "exact", head: true }),
      db.from("User").select("*", { count: "exact", head: true }).eq("isActive", true),
      db.from("Module").select("*", { count: "exact", head: true }).eq("isActive", true),
      db.from("ModuleAssignment").select("*", { count: "exact", head: true }),
      db.from("ModuleCompletion").select("*", { count: "exact", head: true }),
      db.from("QuizAttempt").select("score, passed"),
    ]);

    const attempts = quizAttempts || [];
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((a: number, b: any) => a + b.score, 0) / attempts.length)
      : 0;
    const passRate = attempts.length > 0
      ? Math.round((attempts.filter((a: any) => a.passed).length / attempts.length) * 100)
      : 0;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalModules: totalModules || 0,
      totalAssignments: totalAssignments || 0,
      totalCompletions: completions || 0,
      completionRate: (totalAssignments || 0) > 0 ? Math.round(((completions || 0) / (totalAssignments || 0)) * 100) : 0,
      avgQuizScore: avgScore,
      quizPassRate: passRate,
    });
  }

  if (type === "employees") {
    const { data: users } = await db
      .from("User")
      .select("id, firstName, lastName, role, location")
      .eq("isActive", true);

    const report = await Promise.all(
      (users || []).map(async (u: any) => {
        const [{ count: assignmentCount }, { count: completionCount }] = await Promise.all([
          db.from("ModuleAssignment").select("*", { count: "exact", head: true }).eq("userId", u.id),
          db.from("ModuleCompletion").select("*", { count: "exact", head: true }).eq("userId", u.id),
        ]);
        const assigned = assignmentCount || 0;
        const completed = completionCount || 0;
        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          location: u.location,
          assigned,
          completed,
          completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        };
      })
    );

    return NextResponse.json(report);
  }

  if (type === "overdue") {
    const { data: overdue } = await db
      .from("ModuleAssignment")
      .select("*, user:User(firstName, lastName, role), module:Module(title)")
      .lt("dueDate", new Date().toISOString())
      .neq("status", "COMPLETED");

    return NextResponse.json(overdue || []);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
