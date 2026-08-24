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
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Megaphone,
  ArrowRight,
  Star,
} from "lucide-react";
import { PalomaMan } from "@/components/paloma-man";
import { getAssignedModuleIds } from "@/lib/training-access";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const firstName = user.firstName;

  const assignedModuleIds = Array.from(await getAssignedModuleIds(user.id));

  const [assignmentsResult, completionsResult, quizAttemptsResult, announcementsResult] = await Promise.all([
    db.from("ModuleAssignment").select("*, module:Module(*, section:Section(*))").eq("userId", userId).eq("isActive", true).order("dueDate"),
    db.from("ModuleCompletion").select("*").eq("userId", userId),
    db.from("QuizAttempt").select("*, quiz:Quiz(*, module:Module!Quiz_moduleId_fkey(*, section:Section(*)))").eq("userId", userId).order("completedAt", { ascending: false }).limit(20),
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
    recentModules = (data || []).filter((trainingModule: any) => trainingModule.section?.isActive).slice(0, 6);
  }

  const assignments = (assignmentsResult.data || []).filter((assignment: any) => assignment.module?.isActive && assignment.module?.section?.isActive);
  const completions = completionsResult.data || [];
  const quizAttempts = (quizAttemptsResult.data || []).filter((attempt: any) => {
    const quiz = attempt.quiz;
    if (!quiz?.isActive || attempt.assessmentVersion !== quiz.assessmentVersion) return false;
    if (quiz.quizType === "MODULE") {
      return quiz.module?.isActive && quiz.module?.section?.isActive;
    }
    if (quiz.quizType === "POSITION_FINAL") {
      return quiz.position && user.positions.includes(quiz.position);
    }
    return quiz.quizType === "SECTION";
  }).slice(0, 5);
  const announcements = announcementsResult.data || [];

  const completedIds = new Set(completions.map((c: any) => c.moduleId));
  const totalAssigned = assignments.length;
  const completedAssigned = assignments.filter((a: any) => completedIds.has(a.moduleId)).length;
  const overdue = assignments.filter(
    (a: any) => a.dueDate && new Date(a.dueDate) < new Date() && !completedIds.has(a.moduleId)
  );
  const incomplete = assignments.filter((a: any) => !completedIds.has(a.moduleId));
  const required = assignments.filter((a: any) => a.isRequired && !completedIds.has(a.moduleId));

  // Greeting is Ditch-local time (America/New_York). Vercel runs in UTC,
  // so plain `new Date().getHours()` would say "Good morning" at 9pm EST.
  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
  const greeting =
    localHour < 5
      ? "Working late"
      : localHour < 12
      ? "Good morning"
      : localHour < 17
      ? "Good afternoon"
      : localHour < 22
      ? "Good evening"
      : "Still at it";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <section className="relative overflow-hidden rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full border-[88px] border-ditch-seafoam/[0.08]" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 size-64 rounded-full border-[58px] border-ditch-orange/[0.08]" />
        <div className="relative z-10 max-w-3xl">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-ditch-seafoam">Today at Ditch</p>
          <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">{greeting}, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
            Keep the standard sharp, then bring the good vibes to the floor.
          </p>
        </div>
        <div className="relative z-10 mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 sm:p-4">
            <p className="text-2xl font-black tracking-tight sm:text-3xl">{totalAssigned}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Assigned</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 sm:p-4">
            <p className="text-2xl font-black tracking-tight sm:text-3xl">{completedAssigned}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Complete</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 sm:p-4">
            <p className="text-2xl font-black tracking-tight text-ditch-seafoam sm:text-3xl">{calculatePercentage(completedAssigned, totalAssigned)}%</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Progress</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 sm:p-4">
            <p className={`text-2xl font-black tracking-tight sm:text-3xl ${overdue.length > 0 ? "text-orange-300" : "text-white"}`}>{overdue.length}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Overdue</p>
          </div>
        </div>
        {totalAssigned > 0 && (
          <div className="relative z-10 mt-5 max-w-3xl">
            <ProgressBar value={completedAssigned} max={totalAssigned} showLabel={false} size="md" />
          </div>
        )}
      </section>

      {/* Paloma Man — your guide */}
      <div className="flex justify-end -mt-3">
        <PalomaMan size="md" message={`Need a spec or allergen answer? Ask SpecOS before you guess — guessing is not a hospitality strategy.`} />
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ditch-ink">
            <Megaphone className="w-5 h-5 text-ditch-orange" />
            Announcements
          </h2>
          <div className="space-y-2">
            {announcements.map((ann: any) => (
              <div
                key={ann.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  ann.priority === "URGENT"
                    ? "bg-red-50 border-red-200"
                    : ann.priority === "HIGH"
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white/90 border-ditch-navy/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-ditch-ink">{ann.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ditch-navy/65">{ann.content}</p>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                    className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-ditch-navy/10 hover:bg-ditch-sand/20"
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
                    className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-red-50"
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
                    className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-ditch-sand/20"
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
              Recent Assessments
            </CardTitle>
            <Link href="/quizzes" className="text-sm text-ditch-orange hover:underline">View all</Link>
          </div>
          <CardContent>
            <div className="space-y-3">
              {quizAttempts.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No assessments taken yet.</p>
              ) : (
                quizAttempts.map((attempt: any) => (
                  <div key={attempt.id} className="flex items-center justify-between rounded-xl bg-ditch-navy/[0.035] p-3">
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
          <div>
            <p className="page-kicker">Keep building</p>
            <h2 className="text-xl font-extrabold tracking-tight text-ditch-ink">Your next reps</h2>
          </div>
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
