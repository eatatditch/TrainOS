import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate, calculatePercentage } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Award, BookOpen, CheckCircle2, AlertTriangle, ClipboardCheck } from "lucide-react";

export default async function ProgressPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  const [assignmentsResult, completionsResult, quizAttemptsResult, pathsResult, signoffsResult] = await Promise.all([
    db.from("ModuleAssignment").select("*, module:Module(*, section:Section(*))").eq("userId", userId).eq("isActive", true).order("dueDate"),
    db.from("ModuleCompletion").select("*, module:Module(*, section:Section(*))").eq("userId", userId).order("completedAt", { ascending: false }),
    db.from("QuizAttempt").select("*, quiz:Quiz(*, module:Module(*, section:Section(*)))").eq("userId", userId),
    db.from("UserTrainingPath").select("*, trainingPath:TrainingPath(*, modules:TrainingPathModule(*, module:Module(*, section:Section(*))))").eq("userId", userId).eq("isActive", true),
    db.from("PracticalSignoff").select("moduleId, status, nextAuditAt, auditLog").eq("userId", userId),
  ]);

  const assignments = (assignmentsResult.data || []).filter((assignment: any) => assignment.module?.isActive && assignment.module?.section?.isActive);
  const completions = completionsResult.data || [];
  const quizAttempts = (quizAttemptsResult.data || []).filter((attempt: any) => attempt.quiz?.module?.isActive && attempt.quiz?.module?.section?.isActive);
  const paths = (pathsResult.data || [])
    .filter((pathAssignment: any) => pathAssignment.trainingPath?.isActive)
    .map((pathAssignment: any) => ({
      ...pathAssignment,
      trainingPath: {
        ...pathAssignment.trainingPath,
        modules: (pathAssignment.trainingPath.modules || []).filter((pathModule: any) => pathModule.module?.isActive && pathModule.module?.section?.isActive),
      },
    }));
  const signoffs = signoffsResult.data || [];

  const completedIds = new Set(completions.map((c: any) => c.moduleId));
  const signoffByModule = new Map(signoffs.map((signoff: any) => [signoff.moduleId, signoff]));
  const certifiedIds = new Set(signoffs.filter((signoff: any) => signoff.status === "PASSED").map((signoff: any) => signoff.moduleId));
  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a: any) => completedIds.has(a.moduleId)).length;
  const overdueCount = assignments.filter(
    (a: any) => a.dueDate && new Date(a.dueDate) < new Date() && !completedIds.has(a.moduleId)
  ).length;
  const avgScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((acc: number, a: any) => acc + a.score, 0) / quizAttempts.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-[2rem] border border-ditch-navy/10 bg-white/85 p-6 shadow-[var(--shadow-surf)] sm:p-8">
        <p className="page-kicker">Your scorecard</p>
        <h1 className="page-title">Progress you can feel</h1>
        <p className="page-subtitle">See what you&apos;ve mastered, what&apos;s next, and where another rep will help.</p>
        <div className="mt-6 surf-rule" />
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Assigned" value={totalAssigned} icon={BookOpen} />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle2} />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} />
        <StatCard title="Avg Quiz Score" value={`${avgScore}%`} icon={ClipboardCheck} />
      </div>

      <Card className="border-l-4 border-l-ditch-orange bg-ditch-sand/20">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 size-5 shrink-0 text-ditch-orange" />
          <div><h2 className="font-extrabold text-ditch-ink">Lesson review is not practical certification</h2><p className="mt-1 text-sm leading-6 text-ditch-navy/65">Modules marked practical require a manager-observed pass. Certified skills then enter the 7- and 30-day audit cycle.</p></div>
        </div>
      </Card>

      {/* Overall Progress */}
      <Card className="bg-ditch-navy text-white">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ditch-seafoam">Overall completion</p>
            <CardTitle className="mt-1 text-white">Your full training lineup</CardTitle>
          </div>
          <p className="text-3xl font-black tracking-tight text-ditch-seafoam">{calculatePercentage(completedCount, totalAssigned)}%</p>
        </div>
        <ProgressBar value={completedCount} max={totalAssigned} size="lg" />
      </Card>

      {/* Training Paths */}
      {paths.length > 0 && (
        <div>
          <p className="page-kicker">Assigned journeys</p>
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-ditch-ink">Training paths</h2>
          <div className="space-y-3">
            {paths.map((up: any) => {
              const pathModules = up.trainingPath.modules || [];
              const pathCompleted = pathModules.filter((pm: any) => completedIds.has(pm.moduleId)).length;
              const practicalModules = pathModules.filter((pm: any) => (pm.module?.tags || []).includes("practical-required"));
              const practicalPassed = practicalModules.filter((pm: any) => certifiedIds.has(pm.moduleId)).length;
              const pathCertified = pathCompleted === pathModules.length && practicalPassed === practicalModules.length;
              return (
                <Card key={up.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{up.trainingPath.title}</h3>
                      <p className="text-sm text-gray-500">{up.trainingPath.description}</p>
                    </div>
                    {up.dueDate && (
                      <span className="text-xs text-gray-400">Due {formatDate(up.dueDate)}</span>
                    )}
                  </div>
                  <ProgressBar value={pathCompleted} max={pathModules.length} size="sm" />
                  <p className="text-xs text-gray-400 mt-2">
                    {pathCompleted} of {pathModules.length} modules completed
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {pathCertified ? <Badge variant="completed">Certified</Badge> : pathCompleted === pathModules.length && practicalModules.length > 0 ? <Badge variant="in-progress">Practical pending</Badge> : <Badge variant="optional">In progress</Badge>}
                    {practicalModules.length > 0 && <span className="text-xs text-ditch-navy/50">{practicalPassed} of {practicalModules.length} practicals passed</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Assignments */}
      <div>
        <p className="page-kicker">The full lineup</p>
        <h2 className="mb-4 text-xl font-extrabold tracking-tight text-ditch-ink">Assigned training</h2>
        <div className="data-table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Module</th>
                  <th className="text-left px-4 py-3 font-medium">Section</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ditch-navy/10">
                {assignments.map((a: any) => {
                  const isComplete = completedIds.has(a.moduleId);
                  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !isComplete;
                  const requiresPractical = (a.module?.tags || []).includes("practical-required");
                  const signoff = signoffByModule.get(a.moduleId) as any;
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/training/${a.module.section?.slug}/${a.module.slug}`}
                          className="text-ditch-orange hover:underline font-medium"
                        >
                          {a.module.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.module.section?.title}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {a.dueDate ? formatDate(a.dueDate) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {signoff?.status === "PASSED" ? (
                          <div className="flex flex-col items-start gap-1"><Badge variant="completed">Certified</Badge>{signoff.nextAuditAt && <span className="text-[10px] text-ditch-navy/45">Audit {formatDate(signoff.nextAuditAt)}</span>}</div>
                        ) : signoff?.status === "NEEDS_COACHING" ? (
                          <Badge variant="in-progress">Coaching cycle</Badge>
                        ) : isComplete && requiresPractical ? (
                          <Badge variant="in-progress">Practical pending</Badge>
                        ) : isComplete ? (
                          <Badge variant="completed">Lesson reviewed</Badge>
                        ) : isOverdue ? (
                          <Badge variant="overdue">Overdue</Badge>
                        ) : (
                          <Badge variant="in-progress">In Progress</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Completed History */}
      {completions.length > 0 && (
        <div>
          <p className="page-kicker">Proof of work</p>
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-ditch-ink">Completion history</h2>
          <div className="space-y-2">
            {completions.filter((completion: any) => completion.module?.isActive && completion.module?.section?.isActive).slice(0, 20).map((c: any) => (
              <div key={c.id} className="shell-card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-ditch-green" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.module.title}</p>
                    <p className="text-xs text-gray-500">{c.module.section?.title}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(c.completedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
