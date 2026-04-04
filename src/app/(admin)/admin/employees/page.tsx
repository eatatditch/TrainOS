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
  Plus, Users, Eye, EyeOff,
} from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  location: string;
  phone: string;
  isActive: boolean;
  completions: number;
  assignments: number;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  location: "",
  phone: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch("/api/admin/employees");
    const data = await res.json();
    setEmployees(data);
    setLoading(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const handleSave = async () => {
    await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setShowModal(false);
    setForm({ ...emptyForm });
    fetchEmployees();
  };

  const toggleActive = async (emp: Employee) => {
    await fetch(`/api/admin/employees/${emp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !emp.isActive }),
    });
    fetchEmployees();
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "EMPLOYEE", label: "Employee" },
    { value: "MANAGER", label: "Manager" },
    { value: "ADMIN", label: "Admin" },
    { value: "TRAINER", label: "Trainer" },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage team members and track their progress</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Search by name or email..."
          onSearch={setSearchQuery}
          className="flex-1"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={roleOptions}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Employees Found"
          description={searchQuery || roleFilter ? "Try adjusting your filters." : "Add your first team member to get started."}
          action={
            !searchQuery && !roleFilter ? (
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" /> Add Employee
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Employee</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Location</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Progress</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((emp) => (
                  <tr key={emp.id} className={!emp.isActive ? "opacity-60" : ""}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ditch-navy text-white flex items-center justify-center text-sm font-medium">
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge>{emp.role}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{emp.location || "—"}</td>
                    <td className="py-3">
                      <div className="w-32">
                        <ProgressBar
                          value={emp.completions}
                          max={emp.assignments || 1}
                          size="sm"
                          showLabel={false}
                        />
                        <span className="text-xs text-gray-400 mt-1">
                          {emp.completions}/{emp.assignments} completed
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {emp.isActive ? (
                        <Badge variant="completed">Active</Badge>
                      ) : (
                        <Badge>Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => toggleActive(emp)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={emp.isActive ? "Deactivate" : "Activate"}
                      >
                        {emp.isActive ? (
                          <Eye className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Employee"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Doe"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Temporary password"
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: "EMPLOYEE", label: "Employee" },
              { value: "MANAGER", label: "Manager" },
              { value: "ADMIN", label: "Admin" },
              { value: "TRAINER", label: "Trainer" },
            ]}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g., Downtown Location"
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>Add Employee</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
