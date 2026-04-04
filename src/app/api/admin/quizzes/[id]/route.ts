import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  // Update quiz metadata
  const quiz = await db.quiz.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      passingScore: data.passingScore,
      retryLimit: data.retryLimit,
      isRequired: data.isRequired,
    },
  });

  // If questions provided, replace them
  if (data.questions) {
    await db.quizQuestion.deleteMany({ where: { quizId: id } });
    await db.quizQuestion.createMany({
      data: data.questions.map((q: any, i: number) => ({
        quizId: id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        sortOrder: i,
      })),
    });
  }

  return NextResponse.json(quiz);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.quiz.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
