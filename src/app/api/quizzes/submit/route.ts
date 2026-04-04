import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId, answers } = await request.json();

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Check retry limit
  if (quiz.retryLimit > 0) {
    const attemptCount = await db.quizAttempt.count({
      where: { userId: session.user.id, quizId },
    });
    if (attemptCount >= quiz.retryLimit) {
      return NextResponse.json({ error: "Max attempts reached" }, { status: 400 });
    }
  }

  // Grade quiz
  let correctCount = 0;
  const feedback: Record<string, { correct: boolean; correctAnswer: string; explanation: string }> = {};

  for (const question of quiz.questions) {
    const userAnswer = answers[question.id]?.trim().toLowerCase() || "";
    const correctAnswer = question.correctAnswer.trim().toLowerCase();
    const isCorrect = question.questionType === "SHORT_ANSWER"
      ? correctAnswer.split("|").some((a: string) => userAnswer.includes(a.trim().toLowerCase()))
      : userAnswer === correctAnswer;

    if (isCorrect) correctCount++;

    feedback[question.id] = {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
    };
  }

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: session.user.id,
      score,
      passed,
      answers: answers as any,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ score, passed, feedback, attemptId: attempt.id });
}
