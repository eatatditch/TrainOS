import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuizTaker } from "@/components/training/quiz-taker";

export default async function TakeQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
      module: { include: { section: true } },
    },
  });

  if (!quiz) notFound();

  const attempts = await db.quizAttempt.findMany({
    where: { userId: session.user.id, quizId },
  });

  const canTake = quiz.retryLimit === 0 || attempts.length < quiz.retryLimit;

  const questionsForClient = quiz.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options as string[] | null,
    sortOrder: q.sortOrder,
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={quiz.module ? `/training/${quiz.module.section?.slug}/${quiz.module.slug}` : "/quizzes"}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <p className="text-sm text-ditch-orange font-medium">{quiz.module?.title}</p>
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
        </div>
      </div>

      {quiz.description && (
        <p className="text-gray-500">{quiz.description}</p>
      )}

      <div className="flex gap-4 text-sm text-gray-500">
        <span>{quiz.questions.length} questions</span>
        <span>Passing: {quiz.passingScore}%</span>
        <span>Attempts: {attempts.length}{quiz.retryLimit > 0 ? `/${quiz.retryLimit}` : ""}</span>
      </div>

      {canTake ? (
        <QuizTaker quizId={quiz.id} questions={questionsForClient} passingScore={quiz.passingScore} />
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">You've reached the maximum number of attempts for this quiz.</p>
          <Link href="/quizzes" className="text-ditch-orange hover:underline text-sm mt-2 inline-block">
            Back to Quizzes
          </Link>
        </div>
      )}
    </div>
  );
}
