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

type ManualQuizType = "MODULE" | "SECTION" | "STANDALONE";

function deriveManualQuizType(
  moduleId: string | null,
  sectionId: string | null,
): ManualQuizType {
  if (moduleId) return "MODULE";
  if (sectionId) return "SECTION";
  return "STANDALONE";
}

function questionInsertRow(
  quizId: string,
  question: QuizQuestionInput,
  sortOrder: number,
  sourceModuleId: string | null,
) {
  return {
    quizId,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    sortOrder,
    sourceModuleId,
  };
}

async function validateAssociation(
  moduleId: string | null,
  sectionId: string | null,
): Promise<NextResponse | null> {
  if (moduleId) {
    const { data, error } = await db
      .from("Module")
      .select("id, isActive")
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
    if (!data.isActive) {
      return NextResponse.json(
        { error: "Linked module is archived" },
        { status: 400 },
      );
    }
  }

  if (sectionId) {
    const { data, error } = await db
      .from("Section")
      .select("id, isActive")
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
    if (!data.isActive) {
      return NextResponse.json(
        { error: "Linked section is archived" },
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
    .select(
      "*, module:Module(*, section:Section(*)), section:Section(*), questions:QuizQuestion(*)",
    )
    .order("isActive", { ascending: false })
    .order("title", { ascending: true });

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

  const quizType = deriveManualQuizType(
    data.moduleId ?? null,
    data.sectionId ?? null,
  );

  const { data: quiz, error: quizError } = await db
    .from("Quiz")
    .insert({
      moduleId: data.moduleId ?? null,
      sectionId: data.sectionId ?? null,
      quizType,
      position: null,
      assessmentVersion: 1,
      isActive: true,
      isSystemManaged: false,
      title: data.title,
      description: data.description ?? "",
      passingScore: data.passingScore ?? 70,
      retryLimit: data.retryLimit ?? 3,
      isRequired: data.isRequired ?? false,
    })
    .select()
    .single();

  if (quizError || !quiz) {
    const associationConflict = quizError?.code === "23505";
    return NextResponse.json(
      {
        error: associationConflict
          ? "That module or section already has an active assessment"
          : "Unable to create quiz",
      },
      { status: associationConflict ? 409 : 500 },
    );
  }

  const { data: createdQuestions, error: questionsError } = await db
    .from("QuizQuestion")
    .insert(
      questions.map((question, index) =>
        questionInsertRow(
          quiz.id,
          question,
          index,
          data.moduleId ?? null,
        ),
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
