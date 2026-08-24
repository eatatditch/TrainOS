import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeApi } from "@/lib/api-auth";
import {
  canAccessModule,
  canManageTraining,
  getAccessibleSectionModuleIds,
} from "@/lib/training-access";
import { matchesShortAnswer, normalizeAnswer } from "@/lib/quiz-integrity";

function isAnswerRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi();
  if (!auth.authorized) return auth.response;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isAnswerRecord(body)) {
    return NextResponse.json(
      { error: "Quiz ID and answers are required" },
      { status: 400 },
    );
  }
  const { quizId, answers } = body;
  if (typeof quizId !== "string" || !isAnswerRecord(answers)) {
    return NextResponse.json(
      { error: "Quiz ID and answers are required" },
      { status: 400 },
    );
  }

  const { data: quiz, error: quizError } = await db
    .from("Quiz")
    .select("*, questions:QuizQuestion(*), module:Module(isActive, section:Section(isActive)), section:Section(isActive)")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError) {
    return NextResponse.json(
      { error: "Unable to load the quiz" },
      { status: 500 },
    );
  }
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (
    (quiz.moduleId &&
      (!quiz.module?.isActive || !quiz.module?.section?.isActive)) ||
    (quiz.sectionId && !quiz.section?.isActive)
  ) {
    return NextResponse.json(
      { error: "This quiz is no longer active" },
      { status: 410 },
    );
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return NextResponse.json(
      { error: "This quiz has no questions" },
      { status: 409 },
    );
  }

  if (!canManageTraining(user)) {
    let prerequisiteModuleIds: string[] = [];

    if (quiz.moduleId) {
      if (!(await canAccessModule(user, quiz.moduleId))) {
        return NextResponse.json(
          { error: "This quiz is not part of your assigned training" },
          { status: 403 },
        );
      }
      prerequisiteModuleIds = [quiz.moduleId];
    } else if (quiz.sectionId) {
      prerequisiteModuleIds = await getAccessibleSectionModuleIds(
        user,
        quiz.sectionId,
      );
      if (prerequisiteModuleIds.length === 0) {
        return NextResponse.json(
          { error: "This quiz is not part of your assigned training" },
          { status: 403 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Standalone quizzes require manager access" },
        { status: 403 },
      );
    }

    const { data: completions, error: completionsError } = await db
      .from("ModuleCompletion")
      .select("moduleId")
      .eq("userId", user.id)
      .in("moduleId", prerequisiteModuleIds);
    if (completionsError) {
      return NextResponse.json(
        { error: "Unable to verify training completion" },
        { status: 500 },
      );
    }
    const completedIds = new Set((completions || []).map((row) => row.moduleId));
    if (prerequisiteModuleIds.some((id) => !completedIds.has(id))) {
      return NextResponse.json(
        { error: "Complete the assigned training before taking this quiz" },
        { status: 409 },
      );
    }
  }

  const { count: attemptCount, error: attemptCountError } = await db
    .from("QuizAttempt")
    .select("*", { count: "exact", head: true })
    .eq("userId", user.id)
    .eq("quizId", quizId);
  if (attemptCountError) {
    return NextResponse.json(
      { error: "Unable to verify quiz attempts" },
      { status: 500 },
    );
  }

  const attemptsBefore = attemptCount || 0;
  if (quiz.retryLimit > 0 && attemptsBefore >= quiz.retryLimit) {
    return NextResponse.json(
      {
        error: "Maximum attempts reached",
        attemptsRemaining: 0,
        canRetry: false,
      },
      { status: 409 },
    );
  }

  for (const question of quiz.questions) {
    const submittedAnswer = answers[question.id];
    if (typeof submittedAnswer !== "string" || submittedAnswer.trim() === "") {
      return NextResponse.json(
        { error: "Answer every question before submitting" },
        { status: 400 },
      );
    }
  }

  let correctCount = 0;
  const feedback: Record<string, { correct: boolean; correctAnswer: string; explanation: string }> = {};

  for (const question of quiz.questions) {
    const submittedAnswer = answers[question.id];
    if (
      typeof submittedAnswer !== "string" ||
      typeof question.correctAnswer !== "string"
    ) {
      return NextResponse.json(
        { error: "This quiz contains an invalid answer key" },
        { status: 500 },
      );
    }
    const isCorrect =
      question.questionType === "SHORT_ANSWER"
        ? matchesShortAnswer(submittedAnswer, question.correctAnswer)
        : normalizeAnswer(submittedAnswer) === normalizeAnswer(question.correctAnswer);

    if (isCorrect) correctCount++;

    feedback[question.id] = {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
    };
  }

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  const { data: attempt, error: attemptError } = await db
    .from("QuizAttempt")
    .insert({
      quizId,
      userId: user.id,
      score,
      passed,
      answers,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (attemptError) {
    return NextResponse.json(
      { error: "Unable to save quiz attempt" },
      { status: 500 },
    );
  }

  const attemptsAfter = attemptsBefore + 1;
  const attemptsRemaining =
    quiz.retryLimit > 0
      ? Math.max(0, quiz.retryLimit - attemptsAfter)
      : null;
  const canRetry =
    !passed && (attemptsRemaining === null || attemptsRemaining > 0);

  return NextResponse.json({
    score,
    passed,
    feedback,
    attemptId: attempt?.id,
    attemptsRemaining,
    canRetry,
  });
}
