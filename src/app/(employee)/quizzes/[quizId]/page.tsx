import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { QuizTaker } from "@/components/training/quiz-taker";
import {
  getAssessmentReadiness,
  isQuizType,
  type AssessmentScope,
} from "@/lib/training-access";
import { isPosition } from "@/lib/positions";

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
    .select("*, questions:QuizQuestion(*), module:Module!Quiz_moduleId_fkey(*, section:Section(*)), section:Section(*)")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) notFound();
  if (
    !quiz.isActive ||
    (quiz.moduleId &&
      (!quiz.module?.isActive || !quiz.module?.section?.isActive)) ||
    (quiz.sectionId && !quiz.section?.isActive)
  ) {
    redirect("/quizzes");
  }
  if (!isQuizType(quiz.quizType)) redirect("/quizzes");

  const quizScope: AssessmentScope = {
    id: quiz.id,
    quizType: quiz.quizType,
    moduleId: quiz.moduleId,
    sectionId: quiz.sectionId,
    position: isPosition(quiz.position) ? quiz.position : null,
    assessmentVersion: quiz.assessmentVersion,
    isActive: quiz.isActive,
  };
  const readiness = await getAssessmentReadiness(user, quizScope);
  if (!readiness.authorized || !readiness.ready) redirect("/quizzes");

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
    .eq("quizId", quizId)
    .eq("assessmentVersion", quiz.assessmentVersion)
    .order("completedAt", { ascending: false });
  if (attemptsError) {
    throw new Error("Unable to load quiz attempts");
  }

  const attempts = attemptsData || [];

  const hasPassed = attempts.some((attempt) => attempt.passed);
  const canTake =
    !hasPassed && (quiz.retryLimit === 0 || attempts.length < quiz.retryLimit);
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((attempt) => attempt.score))
    : null;

  const questionsForClient = sortedQuestions.map((question) => ({
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    options: Array.isArray(question.options)
      ? (question.options as string[])
      : null,
    sortOrder: question.sortOrder ?? 0,
  }));
  const assessmentLabel = quiz.quizType === "POSITION_FINAL"
    ? `${quiz.position} final`
    : quiz.quizType === "SECTION"
      ? "Section checkpoint"
      : quiz.module?.title || "Knowledge check";
  const backHref = quiz.module
    ? `/training/${quiz.module.section?.slug}/${quiz.module.slug}`
    : quiz.section?.slug
      ? `/training/${quiz.section.slug}`
      : "/quizzes";

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <header className="rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
      <div className="flex items-start gap-4">
        <Link
          href={backHref}
          aria-label="Back"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-5 text-white/70" />
        </Link>
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ditch-seafoam">{assessmentLabel}</p>
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

      {hasPassed ? (
        <Card className="border-ditch-green/20 bg-ditch-seafoam/20 text-center">
          <CheckCircle2 className="mx-auto size-14 text-ditch-green" />
          <h2 className="mt-3 text-2xl font-black text-ditch-ink">Assessment passed</h2>
          <p className="mt-2 text-sm text-ditch-navy/60">
            Your best current score is {bestScore}%. This assessment is locked in.
          </p>
          <Link href="/quizzes" className="btn-secondary mt-5 inline-flex">
            Back to assessments
          </Link>
        </Card>
      ) : canTake ? (
        <QuizTaker
          quizId={quiz.id}
          questions={questionsForClient}
          passingScore={quiz.passingScore}
          assessmentType={quiz.quizType}
          draftKey={`trainos:assessment:${user.id}:${quiz.id}:v${quiz.assessmentVersion}`}
        />
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">You&apos;ve reached the maximum number of attempts for this quiz.</p>
          <Link href="/quizzes" className="text-ditch-orange hover:underline text-sm mt-2 inline-block">
            Back to assessments
          </Link>
        </div>
      )}
    </div>
  );
}
