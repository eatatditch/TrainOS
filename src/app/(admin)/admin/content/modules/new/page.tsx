"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function NewModuleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get("sectionId") || "";
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sectionId,
    title: "",
    description: "",
    content: "",
    estimatedMinutes: "",
    isRequired: false,
    tags: "",
  });

  useEffect(() => {
    fetch("/api/admin/sections").then((r) => r.json()).then(setSections);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });

    if (res.ok) {
      router.push("/admin/content");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/content" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Module</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={form.sectionId}
              onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-ditch-orange/50 focus:border-ditch-orange bg-white"
              required
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
            placeholder="e.g., Hang 10 Marg Spec"
            required
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief overview of this module..."
          />

          <Textarea
            label="Content (HTML supported)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Full training content... supports HTML"
            className="min-h-[200px]"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Time (minutes)"
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              placeholder="15"
            />
            <Input
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="bartender, cocktails, margarita"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
              className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
            />
            <span className="text-sm text-gray-700">Mark as Required</span>
          </label>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Module"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewModulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" /></div>}>
      <NewModuleForm />
    </Suspense>
  );
}
