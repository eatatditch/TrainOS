import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  // Update quiz metadata
  const { data: quiz, error } = await db
    .from("Quiz")
    .update({
      title: data.title,
      description: data.description,
      passingScore: data.passingScore,
      retryLimit: data.retryLimit,
      isRequired: data.isRequired,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If questions provided, replace them
  if (data.questions) {
    await db.from("QuizQuestion").delete().eq("quizId", id);
    await db.from("QuizQuestion").insert(
      data.questions.map((q: any, i: number) => ({
        quizId: id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        sortOrder: i,
      }))
    );
  }

  return NextResponse.json(quiz);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.from("Quiz").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
