import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import {
  type QuizQuestionInput,
  validateQuizWritePayload,
} from "@/lib/quiz-integrity";

interface AdminQuestionRow extends Record<string, unknown> {
  options: unknown;
  sortOrder?: number | null;
}

interface AdminQuizRow extends Record<string, unknown> {
  questions?: unknown;
}

function questionInsertRow(
  quizId: string,
  question: QuizQuestionInput,
  sortOrder: number,
) {
  return {
    quizId,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    sortOrder,
  };
}

async function validateAssociation(
  moduleId: string | null,
  sectionId: string | null,
): Promise<NextResponse | null> {
  if (moduleId) {
    const { data, error } = await db
      .from("Module")
      .select("id")
      .eq("id", moduleId)
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { error: "Unable to validate the linked module" },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Linked module was not found" },
        { status: 400 },
      );
    }
  }

  if (sectionId) {
    const { data, error } = await db
      .from("Section")
      .select("id")
      .eq("id", sectionId)
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { error: "Unable to validate the linked section" },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Linked section was not found" },
        { status: 400 },
      );
    }
  }

  return null;
}

export async function GET() {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { data: quizzes, error } = await db
    .from("Quiz")
    .select("*, module:Module(*, section:Section(*)), questions:QuizQuestion(*)");

  if (error) {
    return NextResponse.json(
      { error: "Unable to load quizzes" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    ((quizzes || []) as AdminQuizRow[]).map((quiz) => ({
      ...quiz,
      questions: Array.isArray(quiz.questions)
        ? quiz.questions
            .map((question: AdminQuestionRow) => ({
              ...question,
              options: Array.isArray(question.options) ? question.options : [],
            }))
            .sort(
              (left: AdminQuestionRow, right: AdminQuestionRow) =>
                (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
            )
        : [],
    })),
  );
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  let rawData: unknown;
  try {
    rawData = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateQuizWritePayload(rawData, "create");
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const data = validation.value;
  const questions = data.questions || [];

  const associationError = await validateAssociation(
    data.moduleId || null,
    data.sectionId || null,
  );
  if (associationError) return associationError;

  const { data: quiz, error: quizError } = await db
    .from("Quiz")
    .insert({
      moduleId: data.moduleId ?? null,
      sectionId: data.sectionId ?? null,
      title: data.title,
      description: data.description ?? "",
      passingScore: data.passingScore ?? 70,
      retryLimit: data.retryLimit ?? 0,
      isRequired: data.isRequired ?? false,
    })
    .select()
    .single();

  if (quizError || !quiz) {
    return NextResponse.json(
      { error: "Unable to create quiz" },
      { status: 500 },
    );
  }

  const { data: createdQuestions, error: questionsError } = await db
    .from("QuizQuestion")
    .insert(
      questions.map((question, index) =>
        questionInsertRow(quiz.id, question, index),
      ),
    )
    .select();

  if (
    questionsError ||
    !createdQuestions ||
    createdQuestions.length !== questions.length
  ) {
    const { data: rolledBack, error: rollbackError } = await db
      .from("Quiz")
      .delete()
      .eq("id", quiz.id)
      .select("id");
    const rollbackFailed =
      Boolean(rollbackError) || !rolledBack || rolledBack.length !== 1;

    return NextResponse.json(
      {
        error: rollbackFailed
          ? "Quiz questions could not be saved; the incomplete quiz requires administrator review"
          : "Quiz questions could not be saved; no quiz was created",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ...quiz, questions: createdQuestions },
    { status: 201 },
  );
}
