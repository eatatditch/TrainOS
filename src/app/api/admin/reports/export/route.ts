import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { assignments: true, completions: true } },
      quizAttempts: { select: { score: true, passed: true } },
    },
  });

  const headers = ["Name", "Email", "Role", "Location", "Assigned", "Completed", "Completion %", "Avg Quiz Score"];
  const rows = users.map((u) => {
    const avgScore = u.quizAttempts.length > 0
      ? Math.round(u.quizAttempts.reduce((a, b) => a + b.score, 0) / u.quizAttempts.length)
      : 0;
    return [
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.role,
      u.location || "",
      u._count.assignments,
      u._count.completions,
      u._count.assignments > 0 ? Math.round((u._count.completions / u._count.assignments) * 100) : 0,
      avgScore,
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=ditch-training-report.csv",
    },
  });
}
