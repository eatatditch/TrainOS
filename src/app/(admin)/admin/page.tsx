import { db } from "@/lib/db";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Users, BookOpen, CheckCircle2, AlertTriangle,
  ClipboardCheck, TrendingUp, FileText, Megaphone,
} from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const viewer = await getUser();
  const isAdmin = viewer?.role === "SUPER_ADMIN" || viewer?.role === "ADMIN";
  const [
    totalUsersResult, activeUsersResult, totalModulesResult, totalSectionsResult,
    totalAssignmentsResult, totalCompletionsResult, quizAttemptsResult,
    recentAnnouncementsResult,
  ] = await Promise.all([
    db.from("User").select("*", { count: "exact", head: true }),
    db.from("User").select("id, role").eq("isActive", true),
    db.from("Module").select("id").eq("isActive", true),
    db.from("Section").select("*", { count: "exact", head: true }).eq("isActive", true),
    db.from("ModuleAssignment").select("id, userId, moduleId, dueDate").eq("isActive", true),
    db.from("ModuleCompletion").select("userId, moduleId"),
    db.from("QuizAttempt").select("userId, score, passed, assessmentVersion, quiz:Quiz(moduleId, quizType, isActive, assessmentVersion)"),
    db.from("Announcement").select("*").eq("isActive", true).order("createdAt", { ascending: false }).limit(5),
  ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const activeUserRows = activeUsersResult.data || [];
  const activeModuleRows = totalModulesResult.data || [];
  const activeUsers = activeUserRows.length;
  const totalModules = activeModuleRows.length;
  const totalSections = totalSectionsResult.count ?? 0;
  const activeUserIds = new Set(activeUserRows.map((row: any) => row.id));
  const activeModuleIds = new Set(activeModuleRows.map((row: any) => row.id));
  const assignments = (totalAssignmentsResult.data || []).filter((assignment: any) => activeUserIds.has(assignment.userId) && activeModuleIds.has(assignment.moduleId));
  const assignmentKeys = new Set(assignments.map((assignment: any) => `${assignment.userId}:${assignment.moduleId}`));
  const completionKeys = new Set((totalCompletionsResult.data || []).map((completion: any) => `${completion.userId}:${completion.moduleId}`).filter((key: string) => assignmentKeys.has(key)));
  const totalAssignments = assignmentKeys.size;
  const totalCompletions = completionKeys.size;
  const quizAttempts = (quizAttemptsResult.data || []).filter((attempt: any) => {
    if (
      !activeUserIds.has(attempt.userId) ||
      !attempt.quiz?.isActive ||
      attempt.assessmentVersion !== attempt.quiz.assessmentVersion
    ) {
      return false;
    }
    return attempt.quiz.quizType !== "MODULE" || activeModuleIds.has(attempt.quiz.moduleId);
  });
  const overdueAssignments = assignments.filter((assignment: any) => assignment.dueDate && new Date(assignment.dueDate) < new Date() && !completionKeys.has(`${assignment.userId}:${assignment.moduleId}`)).length;
  const recentAnnouncements = recentAnnouncementsResult.data || [];

  // Group by role in JS
  const roleCountMap: Record<string, number> = {};
  for (const u of activeUserRows) {
    roleCountMap[u.role] = (roleCountMap[u.role] || 0) + 1;
  }
  const roleStats = Object.entries(roleCountMap).map(([role, count]) => ({ role, _count: count }));

  const completionRate = totalAssignments > 0
    ? Math.round((totalCompletions / totalAssignments) * 100)
    : 0;
  const avgScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((a: number, b: any) => a + b.score, 0) / quizAttempts.length)
    : 0;
  const passRate = quizAttempts.length > 0
    ? Math.round((quizAttempts.filter((a: any) => a.passed).length / quizAttempts.length) * 100)
    : 0;

  // Recent completions
  const { data: recentCompletions } = await db
    .from("ModuleCompletion")
    .select("*, user:User(firstName, lastName), module:Module(title)")
    .order("completedAt", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] bg-ditch-ink p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border-[72px] border-ditch-orange/[0.07]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-ditch-seafoam">Leadership control room</p>
          <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">Run the standard.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">See where the team is strong, where it&apos;s slipping, and what needs coaching next.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/admin/certifications" className="btn-primary">Record practical</Link>
          <Link href={isAdmin ? "/admin/employees" : "/admin/reports"} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] px-5 text-sm font-bold text-white transition-colors hover:bg-white/15">
            {isAdmin ? "Manage Crew" : "View Reports"}
          </Link>
        </div>
      </div>
      </section>

      {/* Stats Grid */}
      <div>
        <p className="page-kicker">Team health</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Total crew" value={totalUsers} icon={Users} description={`${activeUsers} active`} />
        <StatCard title="Playbook modules" value={totalModules} icon={BookOpen} description={`${totalSections} stages`} />
        <StatCard title="Completion Rate" value={`${completionRate}%`} icon={CheckCircle2} description={`${totalCompletions} completions`} />
        <StatCard title="Overdue" value={overdueAssignments} icon={AlertTriangle} description="assignments overdue" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Knowledge avg" value={`${avgScore}%`} icon={ClipboardCheck} />
        <StatCard title="Pass rate" value={`${passRate}%`} icon={TrendingUp} />
        <StatCard title="Assignments" value={totalAssignments} icon={FileText} />
        <StatCard title="Assessment attempts" value={quizAttempts.length} icon={ClipboardCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team by Role */}
        <Card>
          <CardTitle className="mb-4">Crew by permission level</CardTitle>
          <CardContent>
            <div className="space-y-3">
              {roleStats.map((stat) => (
                <div key={stat.role} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {stat.role.replace("_", " ").toLowerCase()}
                  </span>
                  <Badge>{stat._count} members</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardTitle className="mb-4">Recent momentum</CardTitle>
          <CardContent>
            <div className="space-y-3">
              {(recentCompletions || []).length === 0 ? (
                <p className="py-4 text-center text-sm text-ditch-navy/50">No completions yet</p>
              ) : (
                (recentCompletions || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">
                        {c.user.firstName} {c.user.lastName}
                      </span>
                      <span className="text-gray-400 mx-1">completed</span>
                      <span className="text-gray-700">{c.module.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(c.completedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Live team updates</CardTitle>
            {isAdmin && <Link href="/admin/announcements" className="text-sm text-ditch-orange hover:underline">Manage</Link>}
          </div>
          <CardContent>
            <div className="space-y-3">
              {recentAnnouncements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active announcements</p>
              ) : (
                recentAnnouncements.map((ann: any) => (
                  <div key={ann.id} className="flex items-start justify-between rounded-xl bg-ditch-navy/[0.035] p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{ann.title}</p>
                        <Badge variant={ann.priority === "URGENT" ? "required" : "default"}>
                          {ann.priority.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ann.content?.substring(0, 80)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardTitle className="mb-4">Make a move</CardTitle>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href={isAdmin ? "/admin/content" : "/admin/certifications"} className="rounded-2xl bg-ditch-orange/[0.06] p-4 text-center transition-colors hover:bg-ditch-orange/10">
                <BookOpen className="w-6 h-6 text-ditch-orange mx-auto mb-2" />
                <span className="text-sm font-bold text-ditch-ink">{isAdmin ? "Add Playbook" : "Certify Skill"}</span>
              </Link>
              <Link href={isAdmin ? "/admin/quizzes" : "/admin/reports"} className="p-4 bg-ditch-green/5 rounded-xl text-center hover:bg-ditch-green/10 transition-colors">
                <ClipboardCheck className="w-6 h-6 text-ditch-green mx-auto mb-2" />
                <span className="text-sm font-bold text-ditch-ink">{isAdmin ? "Create Check" : "View Reports"}</span>
              </Link>
              <Link href={isAdmin ? "/admin/employees" : "/admin/menu"} className="p-4 bg-ditch-navy/5 rounded-xl text-center hover:bg-ditch-navy/10 transition-colors">
                <Users className="w-6 h-6 text-ditch-navy mx-auto mb-2" />
                <span className="text-sm font-bold text-ditch-ink">{isAdmin ? "Add Crew" : "Menu Intel"}</span>
              </Link>
              <Link href={isAdmin ? "/admin/announcements" : "/training"} className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition-colors">
                <Megaphone className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-bold text-ditch-ink">{isAdmin ? "Post Update" : "Inspect Playbook"}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
