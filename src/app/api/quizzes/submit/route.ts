import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId, answers } = await request.json();

  const { data: quiz } = await db
    .from("Quiz")
    .select("*, questions:QuizQuestion(*)")
    .eq("id", quizId)
    .single();

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Check retry limit
  if (quiz.retryLimit > 0) {
    const { count: attemptCount } = await db
      .from("QuizAttempt")
      .select("*", { count: "exact", head: true })
      .eq("userId", user.id)
      .eq("quizId", quizId);
    if ((attemptCount || 0) >= quiz.retryLimit) {
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

  const { data: attempt } = await db
    .from("QuizAttempt")
    .insert({
      quizId,
      userId: user.id,
      score,
      passed,
      answers: answers as any,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })
    .select()
    .single();

  return NextResponse.json({ score, passed, feedback, attemptId: attempt?.id });
}
