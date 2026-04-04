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

export default async function AdminDashboardPage() {
  const [
    totalUsersResult, activeUsersResult, totalModulesResult, totalSectionsResult,
    totalAssignmentsResult, totalCompletionsResult, quizAttemptsResult,
    overdueAssignmentsResult, recentAnnouncementsResult, activeUsersForRolesResult,
  ] = await Promise.all([
    db.from("User").select("*", { count: "exact", head: true }),
    db.from("User").select("*", { count: "exact", head: true }).eq("isActive", true),
    db.from("Module").select("*", { count: "exact", head: true }).eq("isActive", true),
    db.from("Section").select("*", { count: "exact", head: true }).eq("isActive", true),
    db.from("ModuleAssignment").select("*", { count: "exact", head: true }),
    db.from("ModuleCompletion").select("*", { count: "exact", head: true }),
    db.from("QuizAttempt").select("score, passed"),
    db.from("ModuleAssignment").select("*", { count: "exact", head: true }).lt("dueDate", new Date().toISOString()).neq("status", "COMPLETED"),
    db.from("Announcement").select("*").eq("isActive", true).order("createdAt", { ascending: false }).limit(5),
    db.from("User").select("role").eq("isActive", true),
  ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const activeUsers = activeUsersResult.count ?? 0;
  const totalModules = totalModulesResult.count ?? 0;
  const totalSections = totalSectionsResult.count ?? 0;
  const totalAssignments = totalAssignmentsResult.count ?? 0;
  const totalCompletions = totalCompletionsResult.count ?? 0;
  const quizAttempts = quizAttemptsResult.data || [];
  const overdueAssignments = overdueAssignmentsResult.count ?? 0;
  const recentAnnouncements = recentAnnouncementsResult.data || [];

  // Group by role in JS
  const activeUsersForRoles = activeUsersForRolesResult.data || [];
  const roleCountMap: Record<string, number> = {};
  for (const u of activeUsersForRoles) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of Ditch Training Platform</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/content" className="btn-primary text-sm">
            Manage Content
          </Link>
          <Link href="/admin/employees" className="btn-secondary text-sm">
            Manage Employees
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={totalUsers} icon={Users} description={`${activeUsers} active`} />
        <StatCard title="Training Modules" value={totalModules} icon={BookOpen} description={`${totalSections} sections`} />
        <StatCard title="Completion Rate" value={`${completionRate}%`} icon={CheckCircle2} description={`${totalCompletions} completions`} />
        <StatCard title="Overdue" value={overdueAssignments} icon={AlertTriangle} description="assignments overdue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Quiz Avg Score" value={`${avgScore}%`} icon={ClipboardCheck} />
        <StatCard title="Quiz Pass Rate" value={`${passRate}%`} icon={TrendingUp} />
        <StatCard title="Total Assignments" value={totalAssignments} icon={FileText} />
        <StatCard title="Quiz Attempts" value={quizAttempts.length} icon={ClipboardCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team by Role */}
        <Card>
          <CardTitle className="mb-4">Team by Role</CardTitle>
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
          <CardTitle className="mb-4">Recent Completions</CardTitle>
          <CardContent>
            <div className="space-y-3">
              {(recentCompletions || []).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No completions yet</p>
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
            <CardTitle>Active Announcements</CardTitle>
            <Link href="/admin/announcements" className="text-sm text-ditch-orange hover:underline">
              Manage
            </Link>
          </div>
          <CardContent>
            <div className="space-y-3">
              {recentAnnouncements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active announcements</p>
              ) : (
                recentAnnouncements.map((ann: any) => (
                  <div key={ann.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
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
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/content" className="p-4 bg-ditch-orange/5 rounded-xl text-center hover:bg-ditch-orange/10 transition-colors">
                <BookOpen className="w-6 h-6 text-ditch-orange mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Add Content</span>
              </Link>
              <Link href="/admin/quizzes" className="p-4 bg-ditch-green/5 rounded-xl text-center hover:bg-ditch-green/10 transition-colors">
                <ClipboardCheck className="w-6 h-6 text-ditch-green mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Create Quiz</span>
              </Link>
              <Link href="/admin/employees" className="p-4 bg-ditch-navy/5 rounded-xl text-center hover:bg-ditch-navy/10 transition-colors">
                <Users className="w-6 h-6 text-ditch-navy mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Add Employee</span>
              </Link>
              <Link href="/admin/announcements" className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition-colors">
                <Megaphone className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Announce</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
