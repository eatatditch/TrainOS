"use client";

import { useCallback, useState, useEffect } from "react";
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

function SortHeader({
  field,
  children,
  activeField,
  direction,
  onSort,
}: {
  field: SortField;
  children: React.ReactNode;
  activeField: SortField;
  direction: SortDir;
  onSort: (field: SortField) => void;
}) {
  return (
    <th scope="col" className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
      <button
        type="button"
        className="flex min-h-11 items-center gap-1 rounded-lg px-1 text-left hover:text-ditch-ink"
        onClick={() => onSort(field)}
        aria-label={`Sort by ${String(children)}${activeField === field ? `, currently ${direction}ending` : ""}`}
      >
        {children}
        <ArrowUpDown className="size-3" aria-hidden="true" />
      </button>
    </th>
  );
}

export default function ReportsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [employeeReport, setEmployeeReport] = useState<EmployeeReport[]>([]);
  const [overdue, setOverdue] = useState<OverdueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, empRes, overdueRes] = await Promise.all([
        fetch("/api/admin/reports?type=overview", { cache: "no-store" }),
        fetch("/api/admin/reports?type=employees", { cache: "no-store" }),
        fetch("/api/admin/reports?type=overdue", { cache: "no-store" }),
      ]);
      const responses = [overviewRes, empRes, overdueRes];
      if (responses.some((response) => !response.ok)) {
        const failed = responses.find((response) => !response.ok);
        const payload = await failed?.json().catch(() => null);
        throw new Error(payload?.error || "Reports could not be loaded.");
      }
      const [overviewData, empData, overdueData] = await Promise.all(
        responses.map((response) => response.json()),
      );
      if (!Array.isArray(empData) || !Array.isArray(overdueData)) {
        throw new Error("Reports returned an unexpected response.");
      }
      setOverview(overviewData as OverviewStats);
      setEmployeeReport(empData as EmployeeReport[]);
      setOverdue(overdueData as OverdueItem[]);
    } catch (loadError) {
      setOverview(null);
      setEmployeeReport([]);
      setOverdue([]);
      setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // State writes in fetchData occur only after the awaited network requests;
    // this call starts the external synchronization for the initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading reports">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="shell-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="page-kicker">Team performance</p>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Spot training momentum, overdue work, and coaching opportunities.</p>
        </div>
        <a href="/api/admin/reports/export" download className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              void fetchData();
            }}
            className="btn-outline shrink-0"
          >
            Try again
          </button>
        </div>
      )}

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
        <nav className="flex gap-6" role="tablist" aria-label="Report views">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              id={`report-tab-${tab.key}`}
              aria-controls={`report-panel-${tab.key}`}
              aria-selected={activeTab === tab.key}
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
        <Card role="tabpanel" id="report-panel-overview" aria-labelledby="report-tab-overview">
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
        <Card role="tabpanel" id="report-panel-employees" aria-labelledby="report-tab-employees">
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
                    <SortHeader field="name" activeField={sortField} direction={sortDir} onSort={handleSort}>Name</SortHeader>
                    <SortHeader field="role" activeField={sortField} direction={sortDir} onSort={handleSort}>Role</SortHeader>
                    <SortHeader field="location" activeField={sortField} direction={sortDir} onSort={handleSort}>Location</SortHeader>
                    <SortHeader field="assigned" activeField={sortField} direction={sortDir} onSort={handleSort}>Assigned</SortHeader>
                    <SortHeader field="completed" activeField={sortField} direction={sortDir} onSort={handleSort}>Completed</SortHeader>
                    <SortHeader field="completionPercent" activeField={sortField} direction={sortDir} onSort={handleSort}>Completion %</SortHeader>
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
        <Card role="tabpanel" id="report-panel-overdue" aria-labelledby="report-tab-overdue">
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
