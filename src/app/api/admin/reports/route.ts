import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") || "overview";

  if (type === "overview") {
    const [totalUsers, activeUsers, totalModules, totalAssignments, completions, quizAttempts] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.module.count({ where: { isActive: true } }),
      db.moduleAssignment.count(),
      db.moduleCompletion.count(),
      db.quizAttempt.findMany({ select: { score: true, passed: true } }),
    ]);

    const avgScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((a, b) => a + b.score, 0) / quizAttempts.length)
      : 0;
    const passRate = quizAttempts.length > 0
      ? Math.round((quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100)
      : 0;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalModules,
      totalAssignments,
      totalCompletions: completions,
      completionRate: totalAssignments > 0 ? Math.round((completions / totalAssignments) * 100) : 0,
      avgQuizScore: avgScore,
      quizPassRate: passRate,
    });
  }

  if (type === "employees") {
    const users = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true, firstName: true, lastName: true, role: true, location: true,
        _count: { select: { assignments: true, completions: true } },
      },
    });

    const report = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      location: u.location,
      assigned: u._count.assignments,
      completed: u._count.completions,
      completionRate: u._count.assignments > 0
        ? Math.round((u._count.completions / u._count.assignments) * 100)
        : 0,
    }));

    return NextResponse.json(report);
  }

  if (type === "overdue") {
    const overdue = await db.moduleAssignment.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
        module: { select: { title: true } },
      },
    });

    return NextResponse.json(overdue);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
