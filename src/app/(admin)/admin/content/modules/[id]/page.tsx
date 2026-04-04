"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({
    sectionId: "",
    title: "",
    description: "",
    content: "",
    estimatedMinutes: "",
    isRequired: false,
    isActive: true,
    tags: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/modules/${id}`).then((r) => r.json()),
      fetch("/api/admin/sections").then((r) => r.json()),
    ]).then(([mod, secs]) => {
      setForm({
        sectionId: mod.sectionId || "",
        title: mod.title,
        description: mod.description || "",
        content: mod.content || "",
        estimatedMinutes: mod.estimatedMinutes?.toString() || "",
        isRequired: mod.isRequired,
        isActive: mod.isActive,
        tags: (mod.tags || []).join(", "),
      });
      setSections(secs);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/modules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    router.push("/admin/content");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this module? This cannot be undone.")) return;
    await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
    router.push("/admin/content");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/content" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete} className="flex items-center gap-1">
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      </div>

      <Card>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={form.sectionId}
              onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-ditch-orange/50 focus:border-ditch-orange bg-white"
            >
              <option value="">Select a section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <Input
            label="Module Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Textarea
            label="Content (HTML supported)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="min-h-[250px] font-mono text-sm"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Time (minutes)"
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
            />
            <Input
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
              />
              <span className="text-sm text-gray-700">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
