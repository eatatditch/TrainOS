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
  Eye, EyeOff, FileText,
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
  const [loading, setLoading] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: "", description: "" });
  const router = useRouter();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const res = await fetch("/api/admin/sections");
    const data = await res.json();
    setSections(data);
    setLoading(false);
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
    if (!confirm("Delete this section and all its modules? This cannot be undone.")) return;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-500 mt-1">Manage training sections and modules</p>
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
