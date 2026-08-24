import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  Lock,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { canManageTraining, getAssignedModuleIds, isQuizType } from "@/lib/training-access";
import { isPosition, type Position } from "@/lib/positions";

interface CoverageRow {
  moduleId: string;
  sortOrder: number;
}

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  quizType: "MODULE" | "SECTION" | "POSITION_FINAL" | "STANDALONE";
  moduleId: string | null;
  sectionId: string | null;
  position: Position | null;
  assessmentVersion: number;
  isActive: boolean;
  passingScore: number;
  retryLimit: number;
  isRequired: boolean;
  module: {
    title: string;
    isActive: boolean;
    section: { title: string; isActive: boolean } | null;
  } | null;
  section: { title: string; isActive: boolean } | null;
  questions: Array<{ id: string }> | null;
  coverage: CoverageRow[] | null;
}

interface QuizAttemptRow {
  id: string;
  quizId: string;
  assessmentVersion: number;
  score: number;
  passed: boolean;
  completedAt: string | null;
  quiz: {
    title: string;
    quizType: string;
    isActive: boolean;
    assessmentVersion: number;
    module: { title: string } | null;
  } | null;
}

interface AssessmentCard extends QuizRow {
  attempts: QuizAttemptRow[];
  ready: boolean;
  lockedReason: string | null;
}

function coverageIds(quiz: QuizRow) {
  if (quiz.moduleId) return [quiz.moduleId];
  return (quiz.coverage || [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((coverage) => coverage.moduleId);
}

function assessmentGroup(quizType: QuizRow["quizType"]) {
  if (quizType === "POSITION_FINAL") return "Position finals";
  if (quizType === "SECTION") return "Section checkpoints";
  if (quizType === "MODULE") return "Module knowledge checks";
  return "Additional assessments";
}

export default async function QuizzesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const managesTraining = canManageTraining(user);
  const accessibleModuleIds = managesTraining
    ? null
    : await getAssignedModuleIds(user.id);

  const [quizzesResult, attemptsResult, completionsResult] = await Promise.all([
    db
      .from("Quiz")
      .select("*, module:Module(title, isActive, section:Section(title, isActive)), section:Section(title, isActive), questions:QuizQuestion(id), coverage:QuizModuleCoverage(moduleId, sortOrder)")
      .eq("isActive", true),
    db
      .from("QuizAttempt")
      .select("id, quizId, assessmentVersion, score, passed, completedAt, quiz:Quiz(title, quizType, isActive, assessmentVersion, module:Module(title))")
      .eq("userId", user.id)
      .order("completedAt", { ascending: false }),
    db
      .from("ModuleCompletion")
      .select("moduleId")
      .eq("userId", user.id),
  ]);
  if (quizzesResult.error) throw new Error("Unable to load assessments");
  if (attemptsResult.error) throw new Error("Unable to load assessment history");
  if (completionsResult.error) throw new Error("Unable to load training progress");

  const allQuizzes = ((quizzesResult.data || []) as unknown as QuizRow[])
    .filter((quiz) => isQuizType(quiz.quizType))
    .filter((quiz) => {
      if (
        quiz.moduleId &&
        (!quiz.module?.isActive || !quiz.module.section?.isActive)
      ) {
        return false;
      }
      if (quiz.sectionId && !quiz.section?.isActive) return false;
      if (managesTraining) return true;

      const moduleIds = coverageIds(quiz);
      if (quiz.quizType === "MODULE") {
        return !!quiz.moduleId && accessibleModuleIds?.has(quiz.moduleId);
      }
      if (quiz.quizType === "SECTION") {
        return moduleIds.length > 0 &&
          moduleIds.every((moduleId) => accessibleModuleIds?.has(moduleId));
      }
      if (quiz.quizType === "POSITION_FINAL") {
        return !!quiz.position &&
          isPosition(quiz.position) &&
          user.positions.includes(quiz.position) &&
          moduleIds.length > 0 &&
          moduleIds.every((moduleId) => accessibleModuleIds?.has(moduleId));
      }
      return false;
    });

  const attempts = (attemptsResult.data || []) as unknown as QuizAttemptRow[];
  const currentVersions = new Map(
    allQuizzes.map((quiz) => [quiz.id, quiz.assessmentVersion]),
  );
  const currentAttempts = attempts.filter(
    (attempt) => currentVersions.get(attempt.quizId) === attempt.assessmentVersion,
  );
  const passedQuizIds = new Set(
    currentAttempts.filter((attempt) => attempt.passed).map((attempt) => attempt.quizId),
  );
  const completedModuleIds = new Set(
    (completionsResult.data || []).map((completion) => completion.moduleId),
  );
  const moduleQuizByModuleId = new Map(
    allQuizzes
      .filter((quiz) => quiz.quizType === "MODULE" && quiz.moduleId)
      .map((quiz) => [quiz.moduleId as string, quiz]),
  );
  const sectionQuizzes = allQuizzes.filter((quiz) => quiz.quizType === "SECTION");

  const assessments: AssessmentCard[] = allQuizzes.map((quiz) => {
    const moduleIds = coverageIds(quiz);
    const missingReviews = moduleIds.filter(
      (moduleId) => !completedModuleIds.has(moduleId),
    );
    const missingModuleChecks = quiz.quizType === "MODULE"
      ? []
      : moduleIds.filter((moduleId) => {
          const moduleQuiz = moduleQuizByModuleId.get(moduleId);
          return !moduleQuiz || !passedQuizIds.has(moduleQuiz.id);
        });
    const moduleSet = new Set(moduleIds);
    const requiredSectionQuizzes = quiz.quizType === "POSITION_FINAL"
      ? sectionQuizzes.filter((sectionQuiz) => {
          const sectionCoverage = coverageIds(sectionQuiz);
          return sectionCoverage.length > 0 &&
            sectionCoverage.every((moduleId) => moduleSet.has(moduleId));
        })
      : [];
    const missingSectionChecks = requiredSectionQuizzes.filter(
      (sectionQuiz) => !passedQuizIds.has(sectionQuiz.id),
    );

    const ready = managesTraining || (
      missingReviews.length === 0 &&
      missingModuleChecks.length === 0 &&
      missingSectionChecks.length === 0
    );
    const lockedReason = ready
      ? null
      : missingReviews.length > 0
        ? `${missingReviews.length} lesson ${missingReviews.length === 1 ? "review" : "reviews"} remaining`
        : missingModuleChecks.length > 0
          ? `${missingModuleChecks.length} module ${missingModuleChecks.length === 1 ? "check" : "checks"} remaining`
          : `${missingSectionChecks.length} section ${missingSectionChecks.length === 1 ? "checkpoint" : "checkpoints"} remaining`;

    return {
      ...quiz,
      attempts: currentAttempts.filter((attempt) => attempt.quizId === quiz.id),
      ready,
      lockedReason,
    };
  });

  const groups = [
    "Position finals",
    "Section checkpoints",
    "Module knowledge checks",
    "Additional assessments",
  ].map((title) => ({
    title,
    assessments: assessments.filter((quiz) => assessmentGroup(quiz.quizType) === title),
  })).filter((group) => group.assessments.length > 0);

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full border-[54px] border-ditch-seafoam/[0.07]" />
        <p className="relative text-[10px] font-extrabold uppercase tracking-[0.22em] text-ditch-seafoam">Assessment center</p>
        <h1 className="relative mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Master the work. Prove the position.</h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-white/60">
          Ten-question module checks build toward section checkpoints and a comprehensive final for each position you hold.
        </p>
        {user.positions.length > 1 ? (
          <p className="relative mt-4 text-xs font-bold text-ditch-seafoam">
            Your positions: {user.positions.join(" · ")}. Each position has its own final.
          </p>
        ) : null}
      </section>

      {assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments assigned"
          description="Your assessments will appear after a position or training path is assigned."
        />
      ) : (
        groups.map((group) => (
          <section key={group.title} className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="page-kicker">
                  {group.title === "Position finals" ? "Certification" : "Curriculum mastery"}
                </p>
                <h2 className="text-xl font-extrabold tracking-tight text-ditch-ink">{group.title}</h2>
              </div>
              <span className="text-xs font-bold text-ditch-navy/40">
                {group.assessments.filter((quiz) => passedQuizIds.has(quiz.id)).length}/{group.assessments.length} passed
              </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {group.assessments.map((quiz) => {
                const bestScore = quiz.attempts.length > 0
                  ? Math.max(...quiz.attempts.map((attempt) => attempt.score))
                  : null;
                const hasPassed = quiz.attempts.some((attempt) => attempt.passed);
                const canRetry = quiz.retryLimit === 0 || quiz.attempts.length < quiz.retryLimit;
                const Icon = quiz.quizType === "POSITION_FINAL"
                  ? Award
                  : quiz.quizType === "SECTION"
                    ? Layers3
                    : ClipboardCheck;

                return (
                  <Card key={quiz.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                      hasPassed
                        ? "bg-ditch-seafoam/30"
                        : quiz.ready
                          ? "bg-ditch-sand/60"
                          : "bg-ditch-navy/[0.06]"
                    }`}>
                      {quiz.ready ? (
                        <Icon className={`size-6 ${hasPassed ? "text-ditch-green" : "text-ditch-orange"}`} />
                      ) : (
                        <Lock className="size-5 text-ditch-navy/35" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold tracking-tight text-ditch-ink">{quiz.title}</h3>
                        {quiz.isRequired ? <Badge variant="required">Required</Badge> : null}
                        {hasPassed ? <Badge variant="completed">Passed</Badge> : null}
                        {quiz.quizType === "POSITION_FINAL" && quiz.position ? <Badge>{quiz.position}</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {quiz.module
                          ? `${quiz.module.section?.title || ""} · ${quiz.module.title}`
                          : quiz.section?.title || quiz.description || "Comprehensive assigned curriculum"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>{(quiz.questions || []).length} questions</span>
                        <span>{coverageIds(quiz).length} {coverageIds(quiz).length === 1 ? "module" : "modules"}</span>
                        <span>Pass: {quiz.passingScore}%</span>
                        <span>{quiz.attempts.length}/{quiz.retryLimit || "∞"} attempts</span>
                        {bestScore !== null ? <span>Best: {bestScore}%</span> : null}
                      </div>
                      {!quiz.ready && quiz.lockedReason ? (
                        <p className="mt-2 text-xs font-bold text-ditch-navy/45">{quiz.lockedReason}</p>
                      ) : null}
                    </div>
                    <div className="w-full shrink-0 sm:w-auto">
                      {hasPassed ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-ditch-green">
                          <CheckCircle2 className="size-4" /> Complete
                        </div>
                      ) : quiz.ready && canRetry ? (
                        <Link href={`/quizzes/${quiz.id}`} className="btn-primary w-full sm:w-auto">
                          {quiz.attempts.length > 0 ? "Retry" : "Start"}
                        </Link>
                      ) : quiz.ready ? (
                        <span className="text-xs text-gray-400">Leader review required</span>
                      ) : (
                        <span className="text-xs font-bold text-ditch-navy/35">Locked</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      {attempts.length > 0 ? (
        <section>
          <p className="page-kicker">Attempt history</p>
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-ditch-ink">Current and archived records</h2>
          <div className="data-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Assessment</th>
                    <th className="px-4 py-3 text-left font-medium">Scope</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Score</th>
                    <th className="px-4 py-3 text-left font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ditch-navy/10">
                  {attempts.map((attempt) => {
                    const isCurrent = currentVersions.get(attempt.quizId) === attempt.assessmentVersion;
                    return (
                      <tr key={attempt.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{attempt.quiz?.title || "Archived assessment"}</td>
                        <td className="px-4 py-3 text-gray-500">{attempt.quiz?.module?.title || attempt.quiz?.quizType?.replaceAll("_", " ") || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{attempt.completedAt ? formatDate(attempt.completedAt) : "—"}</td>
                        <td className="px-4 py-3 font-semibold">{attempt.score}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={attempt.passed ? "completed" : "required"}>
                              {attempt.passed ? "Passed" : "Failed"}
                            </Badge>
                            {!isCurrent ? <Badge>Archived</Badge> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
