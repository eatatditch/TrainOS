"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus, Edit2, Trash2, Route, BookOpen, Users,
} from "lucide-react";
import { POSITIONS, POSITION_DEPARTMENTS, type Position } from "@/lib/positions";

interface TrainingPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  targetPositions: string[];
  moduleIds: string[];
  modules: { id: string; title: string; sortOrder: number }[];
  assignedCount: number;
}

interface Module {
  id: string;
  title: string;
}

const emptyForm = {
  title: "",
  description: "",
  targetPositions: [] as string[],
  moduleIds: [] as string[],
};

const POSITIONS_BY_DEPT: Record<"FOH" | "BOH" | "Management", Position[]> = {
  FOH: POSITIONS.filter((p) => POSITION_DEPARTMENTS[p] === "FOH"),
  BOH: POSITIONS.filter((p) => POSITION_DEPARTMENTS[p] === "BOH"),
  Management: POSITIONS.filter((p) => POSITION_DEPARTMENTS[p] === "Management"),
};

export default function PathsPage() {
  const [paths, setPaths] = useState<TrainingPath[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TrainingPath | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [pathRes, modRes] = await Promise.all([
      fetch("/api/admin/paths", { cache: "no-store" }),
      fetch("/api/admin/modules", { cache: "no-store" }),
    ]);
    const pathData = await pathRes.json();
    const modData = await modRes.json();
    setPaths(pathData);
    setModules(modData);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, targetPositions: [], moduleIds: [] });
    setShowModal(true);
  };

  const openEdit = (path: TrainingPath) => {
    setEditing(path);
    setForm({
      title: path.title,
      description: path.description,
      targetPositions: path.targetPositions || [],
      moduleIds: path.moduleIds || path.modules.map((m) => m.id),
    });
    setShowModal(true);
  };

  const togglePosition = (position: string) => {
    const next = form.targetPositions.includes(position)
      ? form.targetPositions.filter((p) => p !== position)
      : [...form.targetPositions, position];
    setForm({ ...form, targetPositions: next });
  };

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/paths/${editing.id}` : "/api/admin/paths";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`Save failed: ${body.error || res.statusText}`);
      return;
    }

    setShowModal(false);
    setEditing(null);
    setForm({ ...emptyForm });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training path? This cannot be undone.")) return;
    await fetch(`/api/admin/paths/${id}`, { method: "DELETE" });
    fetchData();
  };

  const toggleModule = (moduleId: string) => {
    const ids = form.moduleIds.includes(moduleId)
      ? form.moduleIds.filter((id) => id !== moduleId)
      : [...form.moduleIds, moduleId];
    setForm({ ...form, moduleIds: ids });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Training Paths</h1>
          <p className="text-gray-500 mt-1">Organize modules into structured learning paths</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Path
        </Button>
      </div>

      {paths.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No Training Paths Yet"
          description="Create your first training path to organize modules into a learning sequence."
          action={
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Create Path
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path) => (
            <Card key={path.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ditch-orange/10 rounded-lg">
                    <Route className="w-5 h-5 text-ditch-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{path.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{path.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(path)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(path.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                {path.targetPositions && path.targetPositions.length > 0 ? (
                  path.targetPositions.map((pos) => (
                    <Badge key={pos}>{pos}</Badge>
                  ))
                ) : (
                  <Badge variant="optional">Any position</Badge>
                )}
                <div className="flex items-center gap-1 text-gray-500 ml-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{path.modules.length} modules</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{path.assignedCount} assigned</span>
                </div>
              </div>

              {path.modules.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Modules</span>
                  <ol className="mt-2 space-y-1.5">
                    {path.modules
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((mod, i) => (
                        <li key={mod.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-ditch-orange/10 text-ditch-orange text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          {mod.title}
                        </li>
                      ))}
                  </ol>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Path Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Training Path" : "New Training Path"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., New Server Onboarding"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this training path about?"
          />
          {/* Target Positions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Positions{" "}
              <span className="text-gray-400 font-normal">
                ({form.targetPositions.length} selected — leave empty for any position)
              </span>
            </label>
            <div className="space-y-3 border border-gray-200 rounded-lg p-3">
              {(["FOH", "BOH", "Management"] as const).map((dept) => (
                <div key={dept}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {dept}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POSITIONS_BY_DEPT[dept].map((pos) => {
                      const selected = form.targetPositions.includes(pos);
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => togglePosition(pos)}
                          className={
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors " +
                            (selected
                              ? "bg-ditch-orange text-white border-ditch-orange"
                              : "bg-white text-gray-700 border-gray-200 hover:border-ditch-orange hover:text-ditch-orange")
                          }
                        >
                          {pos}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modules ({form.moduleIds.length} selected)
            </label>
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {modules.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No modules available</p>
              ) : (
                modules.map((mod) => (
                  <label
                    key={mod.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={form.moduleIds.includes(mod.id)}
                      onChange={() => toggleModule(mod.id)}
                      className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
                    />
                    <span className="text-sm text-gray-700">{mod.title}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
