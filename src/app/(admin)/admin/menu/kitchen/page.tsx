"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Flame, Plus, Trash2 } from "lucide-react";

interface ConfigRow {
  key: string;
  value: any;
  label: string;
  notes: string;
  updatedAt: string;
}

export default function KitchenConfigPage() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/kitchen");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (row: ConfigRow) => {
    setSaving(row.key);
    await fetch("/api/admin/kitchen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setSaving(null);
    load();
  };

  const remove = async (key: string) => {
    if (!confirm(`Delete config "${key}"?`)) return;
    await fetch(`/api/admin/kitchen?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    load();
  };

  const updateRow = (key: string, patch: Partial<ConfigRow>) => {
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addNew = async () => {
    if (!newKey || !newLabel) return;
    await fetch("/api/admin/kitchen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: newKey.toLowerCase().replace(/\s+/g, "_"),
        value: false,
        label: newLabel,
        notes: "",
      }),
    });
    setNewKey("");
    setNewLabel("");
    load();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/menu" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-ditch-orange" /> Kitchen Config
          </h1>
          <p className="text-gray-500 mt-1">Global operational settings — cross-contamination, shared equipment, ingredient swaps. These apply to every SpecOS answer instantly.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isBool = typeof row.value === "boolean";
            return (
              <Card key={row.key}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        value={row.label}
                        onChange={(e) => updateRow(row.key, { label: e.target.value })}
                        className="font-medium text-gray-900"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">{row.key}</p>
                    <textarea
                      value={row.notes || ""}
                      onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                      placeholder="Notes (shown in SpecOS warnings)"
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isBool ? (
                      <button
                        onClick={() => updateRow(row.key, { value: !row.value })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          row.value ? "bg-ditch-orange" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            row.value ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    ) : (
                      <Input
                        value={typeof row.value === "string" ? row.value : JSON.stringify(row.value)}
                        onChange={(e) => updateRow(row.key, { value: e.target.value })}
                        className="w-48"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => remove(row.key)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Button size="sm" onClick={() => save(row)} disabled={saving === row.key}>
                        {saving === row.key ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-ditch-orange" /> Add New Config
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Key (snake_case)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <Input
            placeholder="Label (e.g. 'Shared fryer contains gluten')"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={addNew} disabled={!newKey || !newLabel}>
            Add Config
          </Button>
        </div>
      </Card>
    </div>
  );
}
