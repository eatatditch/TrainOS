import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuizTaker } from "@/components/training/quiz-taker";
import {
  canAccessModule,
  canManageTraining,
  getAccessibleSectionModuleIds,
} from "@/lib/training-access";

interface QuizQuestionRow {
  id: string;
  questionText: string;
  questionType: string;
  options: unknown;
  sortOrder: number | null;
}

export default async function TakeQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: quiz, error: quizError } = await db
    .from("Quiz")
    .select("*, questions:QuizQuestion(*), module:Module(*, section:Section(*)), section:Section(*)")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) notFound();
  if (
    (quiz.moduleId &&
      (!quiz.module?.isActive || !quiz.module?.section?.isActive)) ||
    (quiz.sectionId && !quiz.section?.isActive)
  ) {
    redirect("/quizzes");
  }

  if (!canManageTraining(user)) {
    let prerequisiteModuleIds: string[] = [];
    if (quiz.moduleId) {
      if (!(await canAccessModule(user, quiz.moduleId))) redirect("/quizzes");
      prerequisiteModuleIds = [quiz.moduleId];
    } else if (quiz.sectionId) {
      prerequisiteModuleIds = await getAccessibleSectionModuleIds(
        user,
        quiz.sectionId,
      );
      if (prerequisiteModuleIds.length === 0) redirect("/quizzes");
    } else {
      redirect("/quizzes");
    }

    const { data: prerequisiteCompletions, error: completionsError } = await db
      .from("ModuleCompletion")
      .select("moduleId")
      .eq("userId", user.id)
      .in("moduleId", prerequisiteModuleIds);
    if (completionsError) {
      throw new Error("Unable to verify quiz prerequisites");
    }
    const completedIds = new Set(
      (prerequisiteCompletions || []).map((row) => row.moduleId),
    );
    if (prerequisiteModuleIds.some((id) => !completedIds.has(id))) {
      redirect(quiz.module?.section?.slug ? `/training/${quiz.module.section.slug}` : "/training");
    }
  }

  const sortedQuestions = [
    ...((Array.isArray(quiz.questions) ? quiz.questions : []) as QuizQuestionRow[]),
  ].sort(
    (left, right) =>
      (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
  );

  const { data: attemptsData, error: attemptsError } = await db
    .from("QuizAttempt")
    .select("*")
    .eq("userId", user.id)
    .eq("quizId", quizId);
  if (attemptsError) {
    throw new Error("Unable to load quiz attempts");
  }

  const attempts = attemptsData || [];

  const canTake = quiz.retryLimit === 0 || attempts.length < quiz.retryLimit;

  const questionsForClient = sortedQuestions.map((question) => ({
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    options: Array.isArray(question.options)
      ? (question.options as string[])
      : null,
    sortOrder: question.sortOrder ?? 0,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <header className="rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
      <div className="flex items-start gap-4">
        <Link
          href={quiz.module ? `/training/${quiz.module.section?.slug}/${quiz.module.slug}` : "/quizzes"}
          aria-label="Back"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-5 text-white/70" />
        </Link>
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ditch-seafoam">{quiz.module?.title || "Knowledge check"}</p>
          <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">{quiz.title}</h1>
        </div>
      </div>

      {quiz.description && (
        <p className="mt-4 text-sm leading-6 text-white/60">{quiz.description}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs font-bold text-white/45">
        <span>{sortedQuestions.length} questions</span>
        <span>Passing: {quiz.passingScore}%</span>
        <span>Attempts: {attempts.length}{quiz.retryLimit > 0 ? `/${quiz.retryLimit}` : ""}</span>
      </div>
      </header>

      {canTake ? (
        <QuizTaker quizId={quiz.id} questions={questionsForClient} passingScore={quiz.passingScore} />
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">You&apos;ve reached the maximum number of attempts for this quiz.</p>
          <Link href="/quizzes" className="text-ditch-orange hover:underline text-sm mt-2 inline-block">
            Back to Quizzes
          </Link>
        </div>
      )}
    </div>
  );
}
