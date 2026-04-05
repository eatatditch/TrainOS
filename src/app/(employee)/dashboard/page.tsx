import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { formatDate, calculatePercentage, formatDuration } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Megaphone,
  ArrowRight,
  Star,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const firstName = user.firstName;

  // Fetch user's assigned training path modules first
  const { data: userPaths } = await db
    .from("UserTrainingPath")
    .select("trainingPath:TrainingPath(modules:TrainingPathModule(moduleId))")
    .eq("userId", userId);

  const assignedModuleIds: string[] = [];
  (userPaths || []).forEach((up: any) => {
    (up.trainingPath?.modules || []).forEach((tpm: any) => {
      if (tpm.moduleId) assignedModuleIds.push(tpm.moduleId);
    });
  });

  const [assignmentsResult, completionsResult, quizAttemptsResult, announcementsResult] = await Promise.all([
    db.from("ModuleAssignment").select("*, module:Module(*, section:Section(*))").eq("userId", userId).order("dueDate"),
    db.from("ModuleCompletion").select("*").eq("userId", userId),
    db.from("QuizAttempt").select("*, quiz:Quiz(*, module:Module(*))").eq("userId", userId).order("completedAt", { ascending: false }).limit(5),
    db.from("Announcement").select("*").eq("isActive", true).or("expiresAt.is.null,expiresAt.gte." + new Date().toISOString()).order("createdAt", { ascending: false }).limit(5),
  ]);

  // Fetch only assigned modules for the "Recent" section
  let recentModules: any[] = [];
  if (assignedModuleIds.length > 0) {
    const { data } = await db
      .from("Module")
      .select("*, section:Section(*)")
      .eq("isActive", true)
      .in("id", assignedModuleIds)
      .order("createdAt", { ascending: false })
      .limit(6);
    recentModules = data || [];
  }

  const assignments = assignmentsResult.data || [];
  const completions = completionsResult.data || [];
  const quizAttempts = quizAttemptsResult.data || [];
  const announcements = announcementsResult.data || [];

  const completedIds = new Set(completions.map((c: any) => c.moduleId));
  const totalAssigned = assignments.length;
  const completedAssigned = assignments.filter((a: any) => completedIds.has(a.moduleId)).length;
  const overdue = assignments.filter(
    (a: any) => a.dueDate && new Date(a.dueDate) < new Date() && !completedIds.has(a.moduleId)
  );
  const incomplete = assignments.filter((a: any) => !completedIds.has(a.moduleId));
  const required = assignments.filter((a: any) => a.isRequired && !completedIds.has(a.moduleId));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-ditch-navy to-ditch-navy/80 rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold">{greeting}, {firstName}! 🤙</h1>
        <p className="text-white/70 mt-2">Welcome to your Ditch Training Portal</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{totalAssigned}</p>
            <p className="text-xs text-white/70">Assigned</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{completedAssigned}</p>
            <p className="text-xs text-white/70">Completed</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{calculatePercentage(completedAssigned, totalAssigned)}%</p>
            <p className="text-xs text-white/70">Progress</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-300">{overdue.length}</p>
            <p className="text-xs text-white/70">Overdue</p>
          </div>
        </div>
        {totalAssigned > 0 && (
          <div className="mt-4">
            <ProgressBar value={completedAssigned} max={totalAssigned} showLabel={false} size="md" />
          </div>
        )}
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-ditch-orange" />
            Announcements
          </h2>
          <div className="space-y-2">
            {announcements.map((ann: any) => (
              <div
                key={ann.id}
                className={`rounded-lg p-4 border-l-4 ${
                  ann.priority === "URGENT"
                    ? "bg-red-50 border-red-500"
                    : ann.priority === "HIGH"
                    ? "bg-orange-50 border-ditch-orange"
                    : "bg-blue-50 border-ditch-navy"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{ann.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {formatDate(ann.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Required Training */}
        {required.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-red-500" />
                Required Training
              </CardTitle>
              <Badge variant="required">{required.length} remaining</Badge>
            </div>
            <CardContent>
              <div className="space-y-3">
                {required.slice(0, 5).map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/training/${a.module.section?.slug}/${a.module.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.module.title}</p>
                      <p className="text-xs text-gray-500">{a.module.section?.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-ditch-orange transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue Training */}
        {overdue.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Overdue Training
              </CardTitle>
              <Badge variant="overdue">{overdue.length} overdue</Badge>
            </div>
            <CardContent>
              <div className="space-y-3">
                {overdue.slice(0, 5).map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/training/${a.module.section?.slug}/${a.module.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.module.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-red-500" />
                        <p className="text-xs text-red-500">Due {formatDate(a.dueDate!)}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incomplete Training */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-ditch-navy" />
              In Progress
            </CardTitle>
            <Link href="/progress" className="text-sm text-ditch-orange hover:underline">View all</Link>
          </div>
          <CardContent>
            <div className="space-y-3">
              {incomplete.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">All caught up! Nice work.</p>
              ) : (
                incomplete.slice(0, 5).map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/training/${a.module.section?.slug}/${a.module.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.module.title}</p>
                      <p className="text-xs text-gray-500">
                        {a.module.estimatedMinutes ? formatDuration(a.module.estimatedMinutes) : "—"} · {a.module.section?.title}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-ditch-orange transition-colors" />
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-ditch-green" />
              Recent Quizzes
            </CardTitle>
            <Link href="/quizzes" className="text-sm text-ditch-orange hover:underline">View all</Link>
          </div>
          <CardContent>
            <div className="space-y-3">
              {quizAttempts.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No quizzes taken yet.</p>
              ) : (
                quizAttempts.map((attempt: any) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attempt.quiz.title}</p>
                      <p className="text-xs text-gray-500">
                        {attempt.completedAt ? formatDate(attempt.completedAt) : "In progress"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{attempt.score}%</span>
                      <Badge variant={attempt.passed ? "completed" : "required"}>
                        {attempt.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Training Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Training Content</h2>
          <Link href="/training" className="text-sm text-ditch-orange hover:underline flex items-center gap-1">
            Browse Library <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentModules.map((mod: any) => (
            <Link key={mod.id} href={`/training/${mod.section?.slug}/${mod.slug}`}>
              <Card hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ditch-orange font-medium">{mod.section?.title}</p>
                    <h3 className="font-medium text-gray-900 mt-1 truncate">{mod.title}</h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{mod.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {mod.isRequired && <Badge variant="required">Required</Badge>}
                  {mod.estimatedMinutes && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(mod.estimatedMinutes)}
                    </span>
                  )}
                  {completedIds.has(mod.id) && <Badge variant="completed">Done</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
