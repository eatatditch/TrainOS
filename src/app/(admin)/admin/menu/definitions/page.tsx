"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";

interface Definition {
  key: string;
  label: string;
  short_description: string;
  full_description: string;
  safe_for_celiac: boolean | null;
  icon: string | null;
  sortOrder: number;
}

const empty: Definition = {
  key: "",
  label: "",
  short_description: "",
  full_description: "",
  safe_for_celiac: null,
  icon: "",
  sortOrder: 99,
};

export default function DefinitionsPage() {
  const [defs, setDefs] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Definition | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/dietary-definitions");
    const data = await res.json();
    setDefs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing || !editing.key || !editing.label) return;
    setSaving(true);
    await fetch("/api/dietary-definitions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (key: string) => {
    if (!confirm(`Delete "${key}" definition?`)) return;
    await fetch(`/api/dietary-definitions?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/menu" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-ditch-orange" /> Dietary Definitions
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              The precise meaning of each dietary term. Visible to staff in SpecOS and the training platform. Edit any explanation to match your policy.
            </p>
          </div>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>+ New Term</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
        </div>
      ) : (
        <div className="space-y-3">
          {defs.map((d) => (
            <Card key={d.key}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {d.icon && <span className="text-xl">{d.icon}</span>}
                    <h3 className="font-semibold text-gray-900">{d.label}</h3>
                    {d.safe_for_celiac === true && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold uppercase">
                        Celiac-Safe
                      </span>
                    )}
                    {d.safe_for_celiac === false && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold uppercase">
                        Not Celiac-Safe
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{d.short_description}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{d.full_description}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-2">key: {d.key}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(d)}>Edit</Button>
                  <button
                    onClick={() => remove(d.key)}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">
              {defs.some((d) => d.key === editing.key) ? "Edit Definition" : "New Definition"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Input
                  label="Key (slug)"
                  value={editing.key}
                  onChange={(e) => setEditing({ ...editing, key: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="gluten-friendly"
                  disabled={defs.some((d) => d.key === editing.key)}
                />
              </div>
              <Input
                label="Icon (emoji)"
                value={editing.icon || ""}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                placeholder="🌾"
              />
            </div>

            <Input
              label="Label (what staff see)"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="Gluten-Friendly"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short description (one line)</label>
              <textarea
                value={editing.short_description}
                onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full description (the real explanation)</label>
              <textarea
                value={editing.full_description}
                onChange={(e) => setEditing({ ...editing, full_description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Celiac safety</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, safe_for_celiac: true })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    editing.safe_for_celiac === true
                      ? "bg-ditch-green text-white border-ditch-green"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Safe for celiac
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, safe_for_celiac: false })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    editing.safe_for_celiac === false
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  NOT celiac-safe
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, safe_for_celiac: null })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    editing.safe_for_celiac === null
                      ? "bg-gray-600 text-white border-gray-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  N/A
                </button>
              </div>
            </div>

            <Input
              label="Sort order"
              type="number"
              value={String(editing.sortOrder)}
              onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })}
            />

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !editing.key || !editing.label}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
