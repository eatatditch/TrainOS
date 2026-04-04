import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: users } = await db
    .from("User")
    .select("id, email, firstName, lastName, role, location")
    .eq("isActive", true);

  const rows = await Promise.all(
    (users || []).map(async (u: any) => {
      const [{ count: assignmentCount }, { count: completionCount }, { data: quizAttempts }] = await Promise.all([
        db.from("ModuleAssignment").select("*", { count: "exact", head: true }).eq("userId", u.id),
        db.from("ModuleCompletion").select("*", { count: "exact", head: true }).eq("userId", u.id),
        db.from("QuizAttempt").select("score, passed").eq("userId", u.id),
      ]);
      const assigned = assignmentCount || 0;
      const completed = completionCount || 0;
      const attempts = quizAttempts || [];
      const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((a: number, b: any) => a + b.score, 0) / attempts.length)
        : 0;
      return [
        `${u.firstName} ${u.lastName}`,
        u.email,
        u.role,
        u.location || "",
        assigned,
        completed,
        assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        avgScore,
      ];
    })
  );

  const headers = ["Name", "Email", "Role", "Location", "Assigned", "Completed", "Completion %", "Avg Quiz Score"];
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=ditch-training-report.csv",
    },
  });
}
