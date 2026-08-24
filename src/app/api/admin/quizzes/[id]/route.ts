import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_ROLES, authorizeApi } from "@/lib/api-auth";
import {
  isQuizEntityId,
  type QuizQuestionInput,
  validateQuizWritePayload,
} from "@/lib/quiz-integrity";

interface StoredQuiz {
  id: string;
  moduleId: string | null;
  sectionId: string | null;
  title: string;
  description: string | null;
  passingScore: number;
  retryLimit: number;
  isRequired: boolean;
}

interface StoredQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuizQuestionInput["questionType"];
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  sortOrder: number;
}

function questionMutationRow(
  question: QuizQuestionInput,
  sortOrder: number,
) {
  return {
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    sortOrder,
  };
}

function storedQuestionMutationRow(question: StoredQuestion) {
  return {
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    sortOrder: question.sortOrder,
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

async function restoreQuizMetadata(quiz: StoredQuiz): Promise<boolean> {
  const { data, error } = await db
    .from("Quiz")
    .update({
      moduleId: quiz.moduleId,
      sectionId: quiz.sectionId,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      retryLimit: quiz.retryLimit,
      isRequired: quiz.isRequired,
    })
    .eq("id", quiz.id)
    .select("id")
    .single();

  return !error && Boolean(data);
}

async function rollbackQuestionChanges(
  quizId: string,
  insertedIds: string[],
  updatedQuestions: StoredQuestion[],
): Promise<boolean> {
  let rollbackSucceeded = true;

  for (const question of updatedQuestions) {
    const { data, error } = await db
      .from("QuizQuestion")
      .update(storedQuestionMutationRow(question))
      .eq("id", question.id)
      .eq("quizId", quizId)
      .select("id")
      .single();
    if (error || !data) rollbackSucceeded = false;
  }

  if (insertedIds.length > 0) {
    const { data, error } = await db
      .from("QuizQuestion")
      .delete()
      .eq("quizId", quizId)
      .in("id", insertedIds)
      .select("id");
    if (error || !data || data.length !== insertedIds.length) {
      rollbackSucceeded = false;
    }
  }

  return rollbackSucceeded;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  if (!isQuizEntityId(id)) {
    return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
  }

  let rawData: unknown;
  try {
    rawData = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateQuizWritePayload(rawData, "update");
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const changes = validation.value;

  const { data: existingData, error: existingError } = await db
    .from("Quiz")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (existingError) {
    return NextResponse.json(
      { error: "Unable to load the quiz" },
      { status: 500 },
    );
  }
  if (!existingData) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }
  const existing = existingData as StoredQuiz;

  const finalModuleId =
    changes.moduleId !== undefined ? changes.moduleId : existing.moduleId;
  const finalSectionId =
    changes.sectionId !== undefined ? changes.sectionId : existing.sectionId;
  if (finalModuleId && finalSectionId) {
    return NextResponse.json(
      { error: "A quiz can be linked to a module or a section, not both" },
      { status: 400 },
    );
  }

  const associationError = await validateAssociation(
    finalModuleId,
    finalSectionId,
  );
  if (associationError) return associationError;

  const updatePayload: Record<string, string | number | boolean | null> = {};
  if (changes.title !== undefined) updatePayload.title = changes.title;
  if (changes.description !== undefined) {
    updatePayload.description = changes.description;
  }
  if (changes.passingScore !== undefined) {
    updatePayload.passingScore = changes.passingScore;
  }
  if (changes.retryLimit !== undefined) {
    updatePayload.retryLimit = changes.retryLimit;
  }
  if (changes.isRequired !== undefined) {
    updatePayload.isRequired = changes.isRequired;
  }
  if (changes.moduleId !== undefined) updatePayload.moduleId = changes.moduleId;
  if (changes.sectionId !== undefined) {
    updatePayload.sectionId = changes.sectionId;
  }

  let quiz: StoredQuiz = existing;
  const metadataChanged = Object.keys(updatePayload).length > 0;
  if (metadataChanged) {
    const { data: updatedData, error: updateError } = await db
      .from("Quiz")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (updateError || !updatedData) {
      return NextResponse.json(
        { error: "Unable to update the quiz" },
        { status: 500 },
      );
    }
    quiz = updatedData as StoredQuiz;
  }

  if (changes.questions) {
    const { data: questionData, error: questionLoadError } = await db
      .from("QuizQuestion")
      .select("*")
      .eq("quizId", id);
    if (questionLoadError || !questionData) {
      const metadataRestored =
        !metadataChanged || (await restoreQuizMetadata(existing));
      return NextResponse.json(
        {
          error: metadataRestored
            ? "Unable to load the existing questions; the quiz was not changed"
            : "Unable to load the existing questions; quiz metadata requires administrator review",
        },
        { status: 500 },
      );
    }

    const existingQuestions = questionData as StoredQuestion[];
    const existingById = new Map(
      existingQuestions.map((question) => [question.id, question]),
    );
    const submittedIds = new Set(
      changes.questions.flatMap((question) =>
        question.id ? [question.id] : [],
      ),
    );

    for (const submittedId of submittedIds) {
      if (!existingById.has(submittedId)) {
        const metadataRestored =
          !metadataChanged || (await restoreQuizMetadata(existing));
        return NextResponse.json(
          {
            error: metadataRestored
              ? "One or more questions no longer belong to this quiz; refresh and try again"
              : "Question data changed during editing; quiz metadata requires administrator review",
          },
          { status: 409 },
        );
      }
    }

    const newQuestions = changes.questions
      .map((question, sortOrder) => ({ question, sortOrder }))
      .filter(({ question }) => !question.id);
    let insertedIds: string[] = [];

    if (newQuestions.length > 0) {
      const { data: insertedData, error: insertError } = await db
        .from("QuizQuestion")
        .insert(
          newQuestions.map(({ question, sortOrder }) => ({
            quizId: id,
            ...questionMutationRow(question, sortOrder),
          })),
        )
        .select("id");

      if (
        insertError ||
        !insertedData ||
        insertedData.length !== newQuestions.length
      ) {
        const partialInsertedIds = (insertedData || []).flatMap(
          (row: { id?: unknown }) =>
            typeof row.id === "string" ? [row.id] : [],
        );
        let questionsRestored = true;
        if (partialInsertedIds.length > 0) {
          const { data: cleanedUp, error: cleanupError } = await db
            .from("QuizQuestion")
            .delete()
            .eq("quizId", id)
            .in("id", partialInsertedIds)
            .select("id");
          questionsRestored =
            !cleanupError &&
            Boolean(cleanedUp) &&
            cleanedUp?.length === partialInsertedIds.length;
        }
        const metadataRestored =
          !metadataChanged || (await restoreQuizMetadata(existing));
        return NextResponse.json(
          {
            error: questionsRestored && metadataRestored
              ? "Unable to add the new questions; the quiz was not changed"
              : "Unable to add the new questions; the quiz requires administrator review",
          },
          { status: 500 },
        );
      }
      insertedIds = insertedData.map((row: { id: string }) => row.id);
    }

    const updatedSnapshots: StoredQuestion[] = [];
    for (let sortOrder = 0; sortOrder < changes.questions.length; sortOrder += 1) {
      const question = changes.questions[sortOrder];
      if (!question.id) continue;

      const snapshot = existingById.get(question.id);
      if (!snapshot) continue;

      const { data: updatedQuestion, error: questionUpdateError } = await db
        .from("QuizQuestion")
        .update(questionMutationRow(question, sortOrder))
        .eq("id", question.id)
        .eq("quizId", id)
        .select("id")
        .single();

      if (questionUpdateError || !updatedQuestion) {
        const questionsRestored = await rollbackQuestionChanges(
          id,
          insertedIds,
          updatedSnapshots,
        );
        const metadataRestored =
          !metadataChanged || (await restoreQuizMetadata(existing));
        return NextResponse.json(
          {
            error:
              questionsRestored && metadataRestored
                ? "Unable to update the questions; the quiz was not changed"
                : "Question reconciliation failed and requires administrator review",
          },
          { status: 500 },
        );
      }
      updatedSnapshots.push(snapshot);
    }

    const obsoleteIds = existingQuestions
      .filter((question) => !submittedIds.has(question.id))
      .map((question) => question.id);

    if (obsoleteIds.length > 0) {
      const { error: deleteError } = await db
        .from("QuizQuestion")
        .delete()
        .eq("quizId", id)
        .in("id", obsoleteIds);

      if (deleteError) {
        const questionsRestored = await rollbackQuestionChanges(
          id,
          insertedIds,
          updatedSnapshots,
        );
        const metadataRestored =
          !metadataChanged || (await restoreQuizMetadata(existing));
        return NextResponse.json(
          {
            error:
              questionsRestored && metadataRestored
                ? "Unable to remove obsolete questions; the quiz was not changed"
                : "Question reconciliation failed and requires administrator review",
          },
          { status: 500 },
        );
      }
    }
  }

  const { data: savedQuestions, error: savedQuestionsError } = await db
    .from("QuizQuestion")
    .select("*")
    .eq("quizId", id)
    .order("sortOrder", { ascending: true });
  if (savedQuestionsError) {
    return NextResponse.json(
      { error: "Quiz was saved, but its questions could not be reloaded" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ...quiz, questions: savedQuestions || [] });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  if (!isQuizEntityId(id)) {
    return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
  }

  const { data: deleted, error } = await db
    .from("Quiz")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    return NextResponse.json(
      { error: "Unable to delete the quiz" },
      { status: 500 },
    );
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }
  if (deleted.length !== 1) {
    return NextResponse.json(
      { error: "Unexpected quiz deletion result" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
