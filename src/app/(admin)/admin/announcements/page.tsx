"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus, Edit2, Trash2, Megaphone, Eye, EyeOff,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const emptyForm = {
  title: "",
  content: "",
  priority: "NORMAL" as Announcement["priority"],
  expiresAt: "",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setAnnouncements(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditing(ann);
    setForm({
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      expiresAt: ann.expiresAt ? ann.expiresAt.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/announcements/${editing.id}` : "/api/admin/announcements";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        expiresAt: form.expiresAt || null,
      }),
    });

    setShowModal(false);
    setEditing(null);
    setForm({ ...emptyForm });
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  const toggleActive = async (ann: Announcement) => {
    await fetch(`/api/admin/announcements/${ann.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ann.isActive }),
    });
    fetchAnnouncements();
  };

  const getPriorityBadge = (priority: Announcement["priority"]) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="overdue">Urgent</Badge>;
      case "HIGH":
        return <Badge variant="required">High</Badge>;
      case "NORMAL":
        return <Badge variant="in-progress">Normal</Badge>;
      case "LOW":
        return <Badge>Low</Badge>;
    }
  };

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
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
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Communicate important updates to your team</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Yet"
          description="Create your first announcement to share news with your team."
          action={
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Create Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className={!ann.isActive ? "opacity-60" : ""}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ditch-orange/10 rounded-lg">
                    <Megaphone className="w-5 h-5 text-ditch-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                      {getPriorityBadge(ann.priority)}
                      {!ann.isActive && <Badge>Inactive</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Created: {new Date(ann.createdAt).toLocaleDateString()}</span>
                      {ann.expiresAt && (
                        <span>Expires: {new Date(ann.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(ann)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={ann.isActive ? "Deactivate" : "Activate"}
                  >
                    {ann.isActive ? (
                      <Eye className="w-4 h-4 text-gray-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(ann)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Announcement Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Announcement" : "New Announcement"}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., New Menu Items Available"
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your announcement..."
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement["priority"] })}
            options={priorityOptions}
          />
          <Input
            label="Expires At (optional)"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
