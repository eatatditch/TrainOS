import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeApi } from "@/lib/api-auth";
import {
  getAssessmentReadiness,
  isQuizType,
  type AssessmentScope,
} from "@/lib/training-access";
import { matchesShortAnswer, normalizeAnswer } from "@/lib/quiz-integrity";
import { isPosition } from "@/lib/positions";

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
    !quiz.isActive ||
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
  if (!isQuizType(quiz.quizType)) {
    return NextResponse.json(
      { error: "This assessment has an invalid scope" },
      { status: 500 },
    );
  }

  const quizScope: AssessmentScope = {
    id: quiz.id,
    quizType: quiz.quizType,
    moduleId: quiz.moduleId,
    sectionId: quiz.sectionId,
    position: isPosition(quiz.position) ? quiz.position : null,
    assessmentVersion: quiz.assessmentVersion,
    isActive: quiz.isActive,
  };
  let readiness;
  try {
    readiness = await getAssessmentReadiness(user, quizScope);
  } catch {
    return NextResponse.json(
      { error: "Unable to verify assessment prerequisites" },
      { status: 500 },
    );
  }
  if (!readiness.authorized) {
    return NextResponse.json(
      { error: readiness.reason || "This assessment is not assigned to you" },
      { status: 403 },
    );
  }
  if (!readiness.ready) {
    return NextResponse.json(
      { error: readiness.reason || "Complete the prerequisites first" },
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

  const { data: attemptResult, error: attemptError } = await db.rpc(
    "record_quiz_attempt_atomic",
    {
      p_user_id: user.id,
      p_quiz_id: quizId,
      p_answers: answers,
      p_correct_count: correctCount,
      p_started_at: new Date().toISOString(),
    },
  );

  if (attemptError) {
    if (attemptError.message.includes("Maximum attempts reached")) {
      return NextResponse.json(
        {
          error: "Maximum attempts reached",
          attemptsRemaining: 0,
          canRetry: false,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Unable to save quiz attempt" },
      { status: 500 },
    );
  }

  const result = (attemptResult || {}) as Record<string, unknown>;
  if (
    typeof result.score !== "number" ||
    typeof result.passed !== "boolean" ||
    (result.attemptsRemaining !== null &&
      typeof result.attemptsRemaining !== "number") ||
    typeof result.canRetry !== "boolean"
  ) {
    return NextResponse.json(
      { error: "The assessment was saved but its result could not be loaded" },
      { status: 500 },
    );
  }

  const revealAnswers =
    quiz.quizType !== "POSITION_FINAL" || result.passed || !result.canRetry;
  const clientFeedback = Object.fromEntries(
    Object.entries(feedback).map(([questionId, item]) => [
      questionId,
      revealAnswers
        ? item
        : { correct: item.correct, correctAnswer: "", explanation: "" },
    ]),
  );

  return NextResponse.json({
    score: result.score,
    passed: result.passed,
    feedback: clientFeedback,
    attemptId: result.attemptId,
    attemptsRemaining: result.attemptsRemaining,
    canRetry: result.canRetry,
    revealAnswers,
  });
}
