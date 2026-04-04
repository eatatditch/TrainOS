import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate, calculatePercentage, formatDuration } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { BookOpen, CheckCircle2, Clock, AlertTriangle, ClipboardCheck, Target } from "lucide-react";

export default async function ProgressPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  const [assignmentsResult, completionsResult, quizAttemptsResult, pathsResult] = await Promise.all([
    db.from("ModuleAssignment").select("*, module:Module(*, section:Section(*))").eq("userId", userId).order("dueDate"),
    db.from("ModuleCompletion").select("*, module:Module(*, section:Section(*))").eq("userId", userId).order("completedAt", { ascending: false }),
    db.from("QuizAttempt").select("*, quiz:Quiz(*)").eq("userId", userId),
    db.from("UserTrainingPath").select("*, trainingPath:TrainingPath(*, modules:TrainingPathModule(*, module:Module(*)))").eq("userId", userId),
  ]);

  const assignments = assignmentsResult.data || [];
  const completions = completionsResult.data || [];
  const quizAttempts = quizAttemptsResult.data || [];
  const paths = pathsResult.data || [];

  const completedIds = new Set(completions.map((c: any) => c.moduleId));
  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a: any) => completedIds.has(a.moduleId)).length;
  const overdueCount = assignments.filter(
    (a: any) => a.dueDate && new Date(a.dueDate) < new Date() && !completedIds.has(a.moduleId)
  ).length;
  const quizzesPassed = new Set(quizAttempts.filter((a: any) => a.passed).map((a: any) => a.quizId)).size;
  const avgScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((acc: number, a: any) => acc + a.score, 0) / quizAttempts.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
        <p className="text-gray-500 mt-1">Track your training completion and quiz scores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned" value={totalAssigned} icon={BookOpen} />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle2} />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} />
        <StatCard title="Avg Quiz Score" value={`${avgScore}%`} icon={ClipboardCheck} />
      </div>

      {/* Overall Progress */}
      <Card>
        <CardTitle className="mb-4">Overall Completion</CardTitle>
        <ProgressBar value={completedCount} max={totalAssigned} size="lg" />
      </Card>

      {/* Training Paths */}
      {paths.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Paths</h2>
          <div className="space-y-3">
            {paths.map((up: any) => {
              const pathModules = up.trainingPath.modules || [];
              const pathCompleted = pathModules.filter((pm: any) => completedIds.has(pm.moduleId)).length;
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
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Assignments */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Assigned Training</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Module</th>
                  <th className="text-left px-4 py-3 font-medium">Section</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((a: any) => {
                  const isComplete = completedIds.has(a.moduleId);
                  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !isComplete;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
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
                        {isComplete ? (
                          <Badge variant="completed">Complete</Badge>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Completion History</h2>
          <div className="space-y-2">
            {completions.slice(0, 20).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
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
