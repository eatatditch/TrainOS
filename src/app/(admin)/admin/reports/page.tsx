"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users, UserCheck, BookOpen, TrendingUp, Award, BarChart3,
  Download, AlertTriangle, ArrowUpDown,
} from "lucide-react";

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalModules: number;
  completionRate: number;
  avgQuizScore: number;
  passRate: number;
}

interface EmployeeReport {
  id: string;
  name: string;
  role: string;
  location: string;
  assigned: number;
  completed: number;
  completionPercent: number;
}

interface OverdueItem {
  id: string;
  employeeName: string;
  moduleName: string;
  dueDate: string;
}

type Tab = "overview" | "employees" | "overdue";
type SortField = "name" | "role" | "location" | "assigned" | "completed" | "completionPercent";
type SortDir = "asc" | "desc";

export default function ReportsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [employeeReport, setEmployeeReport] = useState<EmployeeReport[]>([]);
  const [overdue, setOverdue] = useState<OverdueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [overviewRes, empRes, overdueRes] = await Promise.all([
      fetch("/api/admin/reports?type=overview"),
      fetch("/api/admin/reports?type=employees"),
      fetch("/api/admin/reports?type=overdue"),
    ]);
    const overviewData = await overviewRes.json();
    const empData = await empRes.json();
    const overdueData = await overdueRes.json();
    setOverview(overviewData);
    setEmployeeReport(empData);
    setOverdue(overdueData);
    setLoading(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedEmployees = [...employeeReport].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const dir = sortDir === "asc" ? 1 : -1;
    if (typeof aVal === "string") return aVal.localeCompare(bVal as string) * dir;
    return ((aVal as number) - (bVal as number)) * dir;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "employees", label: "By Employee" },
    { key: "overdue", label: "Overdue" },
  ];

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 cursor-pointer select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Training analytics and employee progress</p>
        </div>
        <a href="/api/admin/reports/export" download>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </a>
      </div>

      {/* Stat Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Users" value={overview.totalUsers} icon={Users} />
          <StatCard title="Active Users" value={overview.activeUsers} icon={UserCheck} />
          <StatCard title="Modules" value={overview.totalModules} icon={BookOpen} />
          <StatCard title="Completion Rate" value={`${overview.completionRate}%`} icon={TrendingUp} />
          <StatCard title="Avg Quiz Score" value={`${overview.avgQuizScore}%`} icon={Award} />
          <StatCard title="Pass Rate" value={`${overview.passRate}%`} icon={BarChart3} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-ditch-orange text-ditch-orange"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.key === "overdue" && overdue.length > 0 && (
                <Badge variant="required" className="ml-2">{overdue.length}</Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && overview && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Training Overview</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Overall Completion Rate</p>
              <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ditch-green rounded-full transition-all duration-500"
                  style={{ width: `${overview.completionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{overview.completionRate}% of all assignments completed</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quiz Pass Rate</p>
              <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ditch-orange rounded-full transition-all duration-500"
                  style={{ width: `${overview.passRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{overview.passRate}% of quiz attempts passed</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "employees" && (
        <Card>
          {employeeReport.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Employee Data"
              description="Employee progress data will appear here once assignments are made."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <SortHeader field="name">Name</SortHeader>
                    <SortHeader field="role">Role</SortHeader>
                    <SortHeader field="location">Location</SortHeader>
                    <SortHeader field="assigned">Assigned</SortHeader>
                    <SortHeader field="completed">Completed</SortHeader>
                    <SortHeader field="completionPercent">Completion %</SortHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="py-3"><Badge>{emp.role}</Badge></td>
                      <td className="py-3 text-sm text-gray-600">{emp.location || "—"}</td>
                      <td className="py-3 text-sm text-gray-600">{emp.assigned}</td>
                      <td className="py-3 text-sm text-gray-600">{emp.completed}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                emp.completionPercent >= 75
                                  ? "bg-ditch-green"
                                  : emp.completionPercent >= 25
                                  ? "bg-ditch-orange"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${emp.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{emp.completionPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "overdue" && (
        <Card>
          {overdue.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Overdue Assignments"
              description="All employees are on track with their training."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Employee</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Module</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overdue.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm font-medium text-gray-900">{item.employeeName}</td>
                      <td className="py-3 text-sm text-gray-600">{item.moduleName}</td>
                      <td className="py-3">
                        <Badge variant="overdue">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
