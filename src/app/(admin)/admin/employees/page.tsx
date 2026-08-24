"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus, Users, Eye, EyeOff, Route, X, ClipboardCheck, Briefcase,
} from "lucide-react";
import { POSITIONS, POSITION_DEPARTMENTS, POSITION_NOTES, type Position } from "@/lib/positions";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position: Position | null;
  location: string;
  phone: string;
  isActive: boolean;
  skipReviewTimer: boolean;
  _count: { completions: number; assignments: number };
  trainingPaths: { id: string; title: string }[];
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  position: "" as Position | "",
  location: "",
  phone: "",
  trainingPathIds: [] as string[],
};

const POSITION_OPTIONS = [
  { value: "", label: "— Select position —" },
  ...POSITIONS.map((p) => ({
    value: p,
    label: POSITION_NOTES[p] ? `${p} (${POSITION_NOTES[p]})` : p,
  })),
];

const POSITION_FILTER_OPTIONS = [
  { value: "", label: "All Positions" },
  ...POSITIONS.map((p) => ({ value: p, label: p })),
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allPaths, setAllPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [empRes, pathRes] = await Promise.all([
      fetch("/api/admin/employees"),
      fetch("/api/admin/paths"),
    ]);
    setEmployees(await empRes.json());
    setAllPaths(await pathRes.json());
    setLoading(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setSaveError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaveError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setSaveError("First name, last name, and email are required.");
      return;
    }
    if (form.password.length < 12) {
      setSaveError("Temporary password must be at least 12 characters.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setSaveError(body?.error || "Could not add this employee. Please try again.");
        return;
      }
      setShowModal(false);
      setForm({ ...emptyForm });
      await fetchData();
    } catch {
      setSaveError("Could not add this employee. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (emp: Employee) => {
    await fetch(`/api/admin/employees/${emp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !emp.isActive }),
    });
    fetchData();
  };

  const toggleSkipReviewTimer = async (empId: string, skipReviewTimer: boolean) => {
    await fetch(`/api/admin/employees/${empId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skipReviewTimer }),
    });
    // Optimistically update local state for the modal
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, skipReviewTimer } : e))
    );
    setSelectedEmployee((prev) =>
      prev && prev.id === empId ? { ...prev, skipReviewTimer } : prev
    );
  };

  const openPathManager = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowPathModal(true);
  };

  const assignPath = async (pathId: string) => {
    if (!selectedEmployee) return;
    await fetch(`/api/admin/employees/${selectedEmployee.id}/paths`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainingPathId: pathId }),
    });
    fetchData();
    // Refresh selected employee data
    const res = await fetch("/api/admin/employees");
    const updated = await res.json();
    setEmployees(updated);
    setSelectedEmployee(updated.find((e: any) => e.id === selectedEmployee.id) || null);
  };

  const removePath = async (pathId: string) => {
    if (!selectedEmployee) return;
    await fetch(`/api/admin/employees/${selectedEmployee.id}/paths?trainingPathId=${pathId}`, {
      method: "DELETE",
    });
    fetchData();
    const res = await fetch("/api/admin/employees");
    const updated = await res.json();
    setEmployees(updated);
    setSelectedEmployee(updated.find((e: any) => e.id === selectedEmployee.id) || null);
  };

  const toggleFormPath = (pathId: string) => {
    setForm((prev) => ({
      ...prev,
      trainingPathIds: prev.trainingPathIds.includes(pathId)
        ? prev.trainingPathIds.filter((id) => id !== pathId)
        : [...prev.trainingPathIds, pathId],
    }));
  };

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || emp.role === roleFilter;
    const matchesPosition = !positionFilter || emp.position === positionFilter;
    return matchesSearch && matchesRole && matchesPosition;
  });

  const updatePosition = async (empId: string, position: Position | "") => {
    await fetch(`/api/admin/employees/${empId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: position || null }),
    });
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, position: (position || null) as Position | null } : e))
    );
    setSelectedEmployee((prev) =>
      prev && prev.id === empId ? { ...prev, position: (position || null) as Position | null } : prev
    );
  };

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "EMPLOYEE", label: "Employee" },
    { value: "MANAGER", label: "Manager" },
    { value: "ADMIN", label: "Admin" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="shell-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="page-kicker">People & development</p>
          <h1 className="page-title">Crew</h1>
          <p className="page-subtitle">Set access, assign learning paths, and keep every team member moving.</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          placeholder="Search by name or email..."
          onSearch={setSearchQuery}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={roleOptions}
        />
        <Select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          options={POSITION_FILTER_OPTIONS}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Employees Found"
          description={searchQuery || roleFilter ? "Try adjusting your filters." : "Add your first team member."}
          action={!searchQuery && !roleFilter ? <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Employee</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((emp) => (
            <Card key={emp.id} className={!emp.isActive ? "opacity-50" : ""}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-ditch-navy text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {getInitials(emp.firstName, emp.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                    <Badge>{emp.role}</Badge>
                    {emp.position && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ditch-navy/10 text-ditch-navy rounded-full text-xs font-medium">
                        <Briefcase className="w-3 h-3" />
                        {emp.position}
                      </span>
                    )}
                    {emp.isActive ? <Badge variant="completed">Active</Badge> : <Badge>Inactive</Badge>}
                  </div>
                  <p className="text-xs text-gray-400">{emp.email}{emp.location ? ` · ${emp.location}` : ""}</p>

                  {/* Training Paths */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {emp.trainingPaths.length > 0 ? (
                      emp.trainingPaths.map((path) => (
                        <span key={path.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-ditch-orange/10 text-ditch-orange rounded-full text-xs font-medium">
                          <Route className="w-3 h-3" />
                          {path.title}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No training path assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 hidden sm:block">
                    <ProgressBar
                      value={emp._count.completions}
                      max={Math.max(emp._count.assignments, 1)}
                      size="sm"
                      showLabel={false}
                    />
                    <span className="text-xs text-gray-400">{emp._count.completions}/{emp._count.assignments}</span>
                  </div>
                  <button
                    onClick={() => openPathManager(emp)}
                    className="p-2 hover:bg-ditch-orange/10 rounded-lg transition-colors"
                    title="Manage Training"
                  >
                    <Route className="w-4 h-4 text-ditch-orange" />
                  </button>
                  <button
                    onClick={() => {
                      if (emp.isActive && !confirm(`Deactivate ${emp.firstName} ${emp.lastName}? They will lose access to the training platform and SpecOS.`)) return;
                      toggleActive(emp);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      emp.isActive
                        ? "text-red-500 hover:bg-red-50 border border-red-200"
                        : "text-ditch-green hover:bg-green-50 border border-green-200"
                    }`}
                  >
                    {emp.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Employee" size="lg">
        <div className="space-y-4">
          {saveError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {saveError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
            <Input label="Last Name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
          </div>
          <Input label="Email" type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@eatatditch.com" />
          <Input label="Temporary password" type="password" required minLength={12} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 12 characters" />
          <p className="-mt-2 text-xs text-ditch-navy/50">Use a unique 12+ character temporary password and share it privately.</p>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role (permission tier)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: "EMPLOYEE", label: "Employee" },
                { value: "MANAGER", label: "Manager" },
                { value: "ADMIN", label: "Admin" },
                { value: "SUPER_ADMIN", label: "Super Admin" },
              ]}
            />
            <Select
              label="Position (floor job)"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value as Position | "" })}
              options={POSITION_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bay Shore" />
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(631) 555-1234" />
          </div>

          {/* Training Path Assignment */}
          <div className="pt-3 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Route className="w-4 h-4" /> Assign Training Paths
            </label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
              {allPaths.map((path: any) => (
                <label key={path.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.trainingPathIds.includes(path.id)}
                    onChange={() => toggleFormPath(path.id)}
                    className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
                  />
                  <div>
                    <span className="text-sm text-gray-900">{path.title}</span>
                    {path.targetRole && <span className="text-xs text-gray-400 ml-2">({path.targetRole})</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Adding…" : "Add Employee"}</Button>
          </div>
        </div>
      </Modal>

      {/* Training Path Manager Modal */}
      <Modal
        isOpen={showPathModal}
        onClose={() => { setShowPathModal(false); setSelectedEmployee(null); }}
        title={selectedEmployee ? `Training — ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Manage Training"}
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-4">
            {/* Position */}
            <div>
              <Select
                label="Position (floor job)"
                value={selectedEmployee.position || ""}
                onChange={(e) => updatePosition(selectedEmployee.id, e.target.value as Position | "")}
                options={POSITION_OPTIONS}
              />
              <p className="text-xs text-gray-500 mt-1">
                Drives training path auto-assignment and floor scheduling. Separate from permission role.
              </p>
            </div>

            {/* Per-employee settings */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedEmployee.skipReviewTimer}
                  onChange={(e) =>
                    toggleSkipReviewTimer(selectedEmployee.id, e.target.checked)
                  }
                  className="mt-0.5 rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Skip 5-minute review timer
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When enabled, this employee can mark modules complete instantly instead of
                    waiting 5 minutes. Use for managers, trainers, or anyone re-certifying.
                  </p>
                </div>
              </label>
            </div>

            {/* Currently assigned paths */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Training Paths</h3>
              {selectedEmployee.trainingPaths.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-3">No training paths assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEmployee.trainingPaths.map((path) => (
                    <div key={path.id} className="flex items-center justify-between p-3 bg-ditch-orange/5 rounded-lg border border-ditch-orange/20">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-ditch-orange" />
                        <span className="text-sm font-medium text-gray-900">{path.title}</span>
                      </div>
                      <button
                        onClick={() => removePath(path.id)}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new path */}
            <div className="pt-3 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add Training Path</h3>
              {(() => {
                const assignedIds = new Set(selectedEmployee.trainingPaths.map((p) => p.id));
                const available = allPaths.filter((p: any) => !assignedIds.has(p.id));
                if (available.length === 0) {
                  return <p className="text-sm text-gray-400">All available training paths are assigned.</p>;
                }
                return (
                  <div className="space-y-2">
                    {available.map((path: any) => (
                      <button
                        key={path.id}
                        onClick={() => assignPath(path.id)}
                        className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">{path.title}</span>
                          {path.targetRole && <span className="text-xs text-gray-400 ml-2">({path.targetRole})</span>}
                          {path.description && <p className="text-xs text-gray-500 mt-0.5">{path.description}</p>}
                        </div>
                        <Plus className="w-4 h-4 text-ditch-orange shrink-0" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
