import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default async function QuizzesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [assignedQuizzes, attempts] = await Promise.all([
    db.quiz.findMany({
      where: {
        module: {
          assignments: { some: { userId } },
          isActive: true,
        },
      },
      include: {
        module: { include: { section: true } },
        attempts: { where: { userId }, orderBy: { completedAt: "desc" } },
      },
    }),
    db.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { include: { module: { include: { section: true } } } } },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const allQuizzes = await db.quiz.findMany({
    include: {
      module: { include: { section: true } },
      attempts: { where: { userId }, orderBy: { completedAt: "desc" } },
      questions: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
        <p className="text-gray-500 mt-1">View and take quizzes for your training modules</p>
      </div>

      {allQuizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Quizzes Available"
          description="There are no quizzes to take yet. Check back soon!"
        />
      ) : (
        <div className="space-y-4">
          {allQuizzes.map((quiz) => {
            const lastAttempt = quiz.attempts[0];
            const bestScore = quiz.attempts.length > 0
              ? Math.max(...quiz.attempts.map((a) => a.score))
              : null;
            const hasPassed = quiz.attempts.some((a) => a.passed);
            const canRetry = quiz.retryLimit === 0 || quiz.attempts.length < quiz.retryLimit;

            return (
              <Card key={quiz.id} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  hasPassed ? "bg-ditch-green/10" : "bg-ditch-orange/10"
                }`}>
                  <ClipboardCheck className={`w-6 h-6 ${hasPassed ? "text-ditch-green" : "text-ditch-orange"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                    {quiz.isRequired && <Badge variant="required">Required</Badge>}
                    {hasPassed && <Badge variant="completed">Passed</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {quiz.module?.section?.title} · {quiz.module?.title}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{quiz.questions.length} questions</span>
                    <span>Pass: {quiz.passingScore}%</span>
                    <span>{quiz.attempts.length} attempt{quiz.attempts.length !== 1 ? "s" : ""}</span>
                    {bestScore !== null && <span>Best: {bestScore}%</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {canRetry && !hasPassed ? (
                    <Link href={`/quizzes/${quiz.id}`} className="btn-primary text-sm px-4 py-2">
                      {quiz.attempts.length > 0 ? "Retry" : "Start"}
                    </Link>
                  ) : hasPassed ? (
                    <Link href={`/quizzes/${quiz.id}`} className="btn-outline text-sm px-4 py-2">
                      Review
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">Max attempts reached</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz History</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Quiz</th>
                    <th className="text-left px-4 py-3 font-medium">Module</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Score</th>
                    <th className="text-left px-4 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{attempt.quiz.title}</td>
                      <td className="px-4 py-3 text-gray-500">{attempt.quiz.module?.title}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {attempt.completedAt ? formatDate(attempt.completedAt) : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold">{attempt.score}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={attempt.passed ? "completed" : "required"}>
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
