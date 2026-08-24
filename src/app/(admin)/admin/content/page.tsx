"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Trash2, BookOpen, ChevronRight, GripVertical,
  Eye, EyeOff, FileText, ClipboardCheck, Unlink,
} from "lucide-react";
import Link from "next/link";

interface Section {
  id: string;
  title: string;
  description: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  slug: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  estimatedMinutes: number | null;
  tags: string[];
}

export default function ContentManagerPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: "", description: "" });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [secRes, quizRes] = await Promise.all([
      fetch("/api/admin/sections"),
      fetch("/api/admin/quizzes"),
    ]);
    setSections(await secRes.json());
    setAllQuizzes(await quizRes.json());
    setLoading(false);
  };

  const fetchSections = fetchData;

  const getQuizForSection = (sectionId: string) => {
    return allQuizzes.find((q: any) => q.sectionId === sectionId);
  };

  const handleAttachQuizToSection = async (sectionId: string, quizId: string) => {
    await fetch(`/api/admin/quizzes/${quizId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, moduleId: null }),
    });
    fetchData();
  };

  const handleDetachQuizFromSection = async (quizId: string) => {
    await fetch(`/api/admin/quizzes/${quizId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: null }),
    });
    fetchData();
  };

  const handleSaveSection = async () => {
    const method = editingSection ? "PUT" : "POST";
    const url = editingSection ? `/api/admin/sections/${editingSection.id}` : "/api/admin/sections";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionForm),
    });

    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({ title: "", description: "" });
    fetchSections();
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Archive this section and hide its modules from current training? Historical records will be preserved.")) return;
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    fetchSections();
  };

  const toggleSectionActive = async (section: Section) => {
    await fetch(`/api/admin/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !section.isActive }),
    });
    fetchSections();
  };

  const openEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionForm({ title: section.title, description: section.description });
    setShowSectionModal(true);
  };

  const openNewSection = () => {
    setEditingSection(null);
    setSectionForm({ title: "", description: "" });
    setShowSectionModal(true);
  };

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
          <p className="page-kicker">The operating playbook</p>
          <h1 className="page-title">Playbook</h1>
          <p className="page-subtitle">Build the standards, lessons, and coaching reps the team sees.</p>
        </div>
        <Button onClick={openNewSection} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Sections Yet"
          description="Create your first training section to get started."
          action={
            <Button onClick={openNewSection}>
              <Plus className="w-4 h-4 mr-2" /> Create Section
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id} className={!section.isActive ? "opacity-60" : ""}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ditch-orange/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-ditch-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      {!section.isActive && <Badge>Archived</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSectionActive(section)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={section.isActive ? "Archive" : "Activate"}
                  >
                    {section.isActive ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => openEditSection(section)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Modules in section */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">
                    {section.modules.length} modules
                  </span>
                  <Link
                    href={`/admin/content/modules/new?sectionId=${section.id}`}
                    className="text-sm text-ditch-orange hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Module
                  </Link>
                </div>
                <div className="space-y-2">
                  {section.modules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/admin/content/modules/${mod.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{mod.title}</span>
                            {mod.isRequired && <Badge variant="required">Required</Badge>}
                            {!mod.isActive && <Badge>Archived</Badge>}
                          </div>
                          {mod.estimatedMinutes && (
                            <span className="text-xs text-gray-400">{mod.estimatedMinutes} min</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-ditch-orange transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Section Quiz */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardCheck className="w-4 h-4 text-ditch-orange" />
                  <span className="text-sm font-medium text-gray-500">Section Quiz</span>
                </div>
                {(() => {
                  const quiz = getQuizForSection(section.id);
                  if (quiz) {
                    return (
                      <div className="flex items-center justify-between p-3 bg-ditch-orange/5 rounded-lg border border-ditch-orange/20">
                        <div className="flex items-center gap-3">
                          <ClipboardCheck className="w-5 h-5 text-ditch-orange" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
                            <p className="text-xs text-gray-500">{(quiz.questions || []).length} questions · Pass: {quiz.passingScore}%</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDetachQuizFromSection(quiz.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Unlink className="w-3 h-3" /> Detach
                        </button>
                      </div>
                    );
                  }
                  const availableQuizzes = allQuizzes.filter((q: any) => !q.sectionId && !q.moduleId);
                  return (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAttachQuizToSection(section.id, e.target.value);
                        }}
                      >
                        <option value="">Attach a quiz to this section...</option>
                        {availableQuizzes.map((q: any) => (
                          <option key={q.id} value={q.id}>{q.title} ({(q.questions || []).length} questions)</option>
                        ))}
                      </select>
                      <Link href="/admin/quizzes" className="px-3 py-2 text-sm text-ditch-orange hover:bg-ditch-orange/10 rounded-lg transition-colors whitespace-nowrap">
                        + New
                      </Link>
                    </div>
                  );
                })()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Section Modal */}
      <Modal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        title={editingSection ? "Edit Section" : "New Section"}
      >
        <div className="space-y-4">
          <Input
            label="Section Title"
            value={sectionForm.title}
            onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
            placeholder="e.g., Server Training"
          />
          <Textarea
            label="Description"
            value={sectionForm.description}
            onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
            placeholder="What does this section cover?"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowSectionModal(false)}>Cancel</Button>
            <Button onClick={handleSaveSection}>{editingSection ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
