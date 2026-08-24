"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2, FileText, X, Video, Image as ImageIcon, ClipboardCheck, Link2, Unlink } from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/admin/file-upload";

interface ModuleAsset {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [assets, setAssets] = useState<ModuleAsset[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [attachedQuiz, setAttachedQuiz] = useState<any>(null);
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

  const fetchModule = () => {
    return fetch(`/api/admin/modules/${id}`).then((r) => r.json());
  };

  useEffect(() => {
    Promise.all([
      fetchModule(),
      fetch("/api/admin/sections").then((r) => r.json()),
      fetch("/api/admin/quizzes").then((r) => r.json()),
    ]).then(([mod, secs, quizzes]) => {
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
      setAssets(mod.assets || []);
      setSections(secs);
      setAllQuizzes(quizzes || []);
      setAttachedQuiz(mod.quiz || null);
      setLoading(false);
    });
  }, [id]);

  const handleAttachQuiz = async (quizId: string) => {
    if (!quizId) return;
    await fetch(`/api/admin/quizzes/${quizId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: id }),
    });
    // Refresh
    const mod = await fetchModule();
    setAttachedQuiz(mod.quiz || null);
    const quizzes = await fetch("/api/admin/quizzes").then((r) => r.json());
    setAllQuizzes(quizzes || []);
  };

  const handleDetachQuiz = async () => {
    if (!attachedQuiz) return;
    await fetch(`/api/admin/quizzes/${attachedQuiz.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: null }),
    });
    setAttachedQuiz(null);
    const quizzes = await fetch("/api/admin/quizzes").then((r) => r.json());
    setAllQuizzes(quizzes || []);
  };

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
    if (!confirm("Archive this module? It will leave current training, but historical records and files will be preserved.")) return;
    await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
    router.push("/admin/content");
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Delete this file?")) return;
    const res = await fetch(`/api/admin/assets/${assetId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    }
  };

  const handleUploadComplete = (data: any) => {
    if (data.asset) {
      setAssets((prev) => [...prev, data.asset]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

          {/* Quiz Attachment */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Attached Quiz
            </h3>

            {attachedQuiz ? (
              <div className="flex items-center justify-between p-3 bg-ditch-orange/5 rounded-lg border border-ditch-orange/20">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-ditch-orange" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attachedQuiz.title}</p>
                    <p className="text-xs text-gray-500">
                      {(attachedQuiz.questions || []).length} questions · Pass: {attachedQuiz.passingScore}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDetachQuiz}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                >
                  <Unlink className="w-3 h-3" /> Detach
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">No quiz attached. Select one to link or create a new quiz in the Quiz Builder.</p>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleAttachQuiz(e.target.value);
                    }}
                  >
                    <option value="">Select a quiz to attach...</option>
                    {allQuizzes
                      .filter((q: any) => !q.moduleId || q.moduleId === id)
                      .map((q: any) => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({(q.questions || []).length} questions)
                        </option>
                      ))}
                  </select>
                  <Link href="/admin/quizzes" className="px-3 py-2 text-sm text-ditch-orange hover:bg-ditch-orange/10 rounded-lg transition-colors whitespace-nowrap">
                    + New Quiz
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Training Videos */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" /> Training Videos
            </h3>

            {assets.filter((a) => a.fileType === "VIDEO").length > 0 && (
              <div className="space-y-3 mb-4">
                {assets.filter((a) => a.fileType === "VIDEO").map((asset) => (
                  <div key={asset.id} className="rounded-lg border overflow-hidden">
                    <video controls preload="metadata" className="w-full bg-gray-900" style={{ maxHeight: "300px" }}>
                      <source src={asset.fileUrl} />
                    </video>
                    <div className="flex items-center justify-between p-2 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{asset.fileName}</span>
                        {asset.fileSize > 0 && (
                          <span className="text-xs text-gray-400">{formatFileSize(asset.fileSize)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <FileUpload
              moduleId={id}
              onUploadComplete={handleUploadComplete}
              accept="video/*"
              fileType="VIDEO"
              label="Upload Video"
              hint="MP4, MOV, WebM — max 500MB"
            />
          </div>

          {/* Documents & Files */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documents & Files
            </h3>

            {assets.filter((a) => a.fileType !== "VIDEO").length > 0 && (
              <div className="space-y-2 mb-4">
                {assets.filter((a) => a.fileType !== "VIDEO").map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {asset.fileType === "IMAGE" ? (
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-ditch-orange"
                        >
                          {asset.fileName}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge>{asset.fileType}</Badge>
                          {asset.fileSize > 0 && (
                            <span className="text-xs text-gray-400">{formatFileSize(asset.fileSize)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FileUpload
              moduleId={id}
              onUploadComplete={handleUploadComplete}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
              fileType="DOCUMENT"
              label="Upload Document or Image"
              hint="PDF, DOC, PNG, JPG"
            />
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
