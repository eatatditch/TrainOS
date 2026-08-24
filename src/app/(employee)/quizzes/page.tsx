import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { canManageTraining, getAssignedModuleIds } from "@/lib/training-access";

interface QuizModuleSummary {
  title: string;
  isActive: boolean;
  section: {
    title: string;
    isActive: boolean;
  } | null;
}

interface QuizRow {
  id: string;
  title: string;
  moduleId: string | null;
  sectionId: string | null;
  passingScore: number;
  retryLimit: number;
  isRequired: boolean;
  module: QuizModuleSummary | null;
  section: { isActive: boolean } | null;
  questions: Array<{ id: string }> | null;
}

interface QuizAttemptRow {
  id: string;
  quizId: string;
  score: number;
  passed: boolean;
  completedAt: string | null;
}

interface QuizAttemptHistoryRow extends QuizAttemptRow {
  quiz: {
    title: string;
    module: { title: string } | null;
  } | null;
}

interface QuizWithAttempts extends QuizRow {
  attempts: QuizAttemptRow[];
}

export default async function QuizzesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const managesTraining = canManageTraining(user);
  const accessibleModuleIds = managesTraining
    ? null
    : await getAssignedModuleIds(user.id);
  const accessibleSectionIds = new Set<string>();
  if (accessibleModuleIds && accessibleModuleIds.size > 0) {
    const { data: assignedModules, error: assignedModulesError } = await db
      .from("Module")
      .select("sectionId, isActive, section:Section(isActive)")
      .in("id", Array.from(accessibleModuleIds));
    if (assignedModulesError) {
      throw new Error("Unable to load assigned training sections");
    }
    for (const assignedModule of assignedModules || []) {
      const parentSection = assignedModule.section as unknown as {
        isActive?: boolean;
      } | null;
      if (assignedModule.isActive && parentSection?.isActive && assignedModule.sectionId) {
        accessibleSectionIds.add(assignedModule.sectionId);
      }
    }
  }

  const { data: allQuizzesData, error: quizzesError } = await db
    .from("Quiz")
    .select("*, module:Module(*, section:Section(*)), section:Section(*), questions:QuizQuestion(*)");
  if (quizzesError) throw new Error("Unable to load quizzes");

  const allQuizzesRaw = ((allQuizzesData || []) as QuizRow[]).filter((quiz) => {
    if (
      quiz.moduleId &&
      (!quiz.module?.isActive || !quiz.module?.section?.isActive)
    ) {
      return false;
    }
    if (quiz.sectionId && !quiz.section?.isActive) return false;
    if (accessibleModuleIds === null) return true;
    if (quiz.moduleId) return accessibleModuleIds.has(quiz.moduleId);
    if (quiz.sectionId) return accessibleSectionIds.has(quiz.sectionId);
    return false;
  });

  const { data: attemptsData, error: attemptsError } = await db
    .from("QuizAttempt")
    .select("*, quiz:Quiz(*, module:Module(*, section:Section(*)))")
    .eq("userId", userId)
    .order("completedAt", { ascending: false });
  if (attemptsError) throw new Error("Unable to load quiz history");

  const attempts = (attemptsData || []) as QuizAttemptHistoryRow[];

  const { data: userAttemptsData, error: userAttemptsError } = await db
    .from("QuizAttempt")
    .select("*")
    .eq("userId", userId)
    .order("completedAt", { ascending: false });
  if (userAttemptsError) throw new Error("Unable to load quiz attempts");

  const userAttempts = (userAttemptsData || []) as QuizAttemptRow[];

  const attemptsByQuiz: Record<string, QuizAttemptRow[]> = {};
  for (const attempt of userAttempts) {
    if (!attemptsByQuiz[attempt.quizId]) attemptsByQuiz[attempt.quizId] = [];
    attemptsByQuiz[attempt.quizId].push(attempt);
  }

  const allQuizzes: QuizWithAttempts[] = allQuizzesRaw.map((quiz) => ({
    ...quiz,
    attempts: attemptsByQuiz[quiz.id] || [],
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full border-[54px] border-ditch-seafoam/[0.07]" />
        <p className="relative text-[10px] font-extrabold uppercase tracking-[0.22em] text-ditch-seafoam">Knowledge checks</p>
        <h1 className="relative mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Know it without guessing.</h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-white/60">Quick checks on the details that matter when a guest is standing in front of you.</p>
      </section>

      {allQuizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Quizzes Available"
          description="There are no quizzes to take yet. Check back soon!"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {allQuizzes.map((quiz) => {
            const bestScore = quiz.attempts.length > 0
              ? Math.max(...quiz.attempts.map((attempt) => attempt.score))
              : null;
            const hasPassed = quiz.attempts.some((attempt) => attempt.passed);
            const canRetry = quiz.retryLimit === 0 || quiz.attempts.length < quiz.retryLimit;

            return (
              <Card key={quiz.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                  hasPassed ? "bg-ditch-seafoam/30" : "bg-ditch-sand/60"
                }`}>
                  <ClipboardCheck className={`w-6 h-6 ${hasPassed ? "text-ditch-green" : "text-ditch-orange"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold tracking-tight text-ditch-ink">{quiz.title}</h3>
                    {quiz.isRequired && <Badge variant="required">Required</Badge>}
                    {hasPassed && <Badge variant="completed">Passed</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {quiz.module ? `${quiz.module.section?.title || ""} · ${quiz.module.title}` : "Standalone Quiz"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{(quiz.questions || []).length} questions</span>
                    <span>Pass: {quiz.passingScore}%</span>
                    <span>{quiz.attempts.length} attempt{quiz.attempts.length !== 1 ? "s" : ""}</span>
                    {bestScore !== null && <span>Best: {bestScore}%</span>}
                  </div>
                </div>
                <div className="w-full shrink-0 sm:w-auto">
                  {canRetry && !hasPassed ? (
                    <Link href={`/quizzes/${quiz.id}`} className="btn-primary w-full sm:w-auto">
                      {quiz.attempts.length > 0 ? "Retry" : "Start"}
                    </Link>
                  ) : hasPassed ? (
                    <Link href={`/quizzes/${quiz.id}`} className="btn-outline w-full sm:w-auto">
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
          <p className="page-kicker">Previous reps</p>
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-ditch-ink">Knowledge check history</h2>
          <div className="data-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Quiz</th>
                    <th className="text-left px-4 py-3 font-medium">Module</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Score</th>
                    <th className="text-left px-4 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ditch-navy/10">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{attempt.quiz?.title || "Archived quiz"}</td>
                      <td className="px-4 py-3 text-gray-500">{attempt.quiz?.module?.title || "—"}</td>
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
