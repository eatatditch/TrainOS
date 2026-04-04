import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const quizzes = await db.quiz.findMany({
    include: { module: { include: { section: true } }, questions: true },
  });
  return NextResponse.json(quizzes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  const quiz = await db.quiz.create({
    data: {
      moduleId: data.moduleId,
      title: data.title,
      description: data.description || "",
      passingScore: data.passingScore || 70,
      retryLimit: data.retryLimit || 0,
      isRequired: data.isRequired || false,
      questions: {
        create: (data.questions || []).map((q: any, i: number) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          sortOrder: i,
        })),
      },
    },
    include: { questions: true },
  });

  return NextResponse.json(quiz);
}
