"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Award, CheckCircle2, ClipboardCheck, Plus, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Employee = { id: string; firstName: string; lastName: string; position: string | null; location: string | null };
type PracticalModule = { id: string; title: string; section?: { title: string } | null };
type Signoff = {
  id: string;
  userId: string;
  moduleId: string;
  status: "PASSED" | "NEEDS_COACHING" | "REVOKED";
  evidence: string;
  signedAt: string | null;
  nextAuditAt: string | null;
  auditScheduleDays: number[];
  auditStep: number;
  auditLog: unknown[];
  user?: { firstName: string; lastName: string; position: string | null } | null;
  module?: { title: string; section?: { title: string } | null } | null;
  verifier?: { firstName: string; lastName: string } | null;
};

const initialForm = {
  userId: "",
  moduleId: "",
  status: "PASSED",
  evidence: "",
  notes: "",
  criticalChecks: [] as string[],
};

const checkOptions = [
  { id: "standard", label: "Standard performed accurately" },
  { id: "safety", label: "No critical safety or integrity miss" },
  { id: "live", label: "Skill transferred to a live or pressure-tested rep" },
];

export default function CertificationsPage() {
  const [users, setUsers] = useState<Employee[]>([]);
  const [modules, setModules] = useState<PracticalModule[]>([]);
  const [signoffs, setSignoffs] = useState<Signoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/certifications", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not load certifications");
      setUsers(data.users || []);
      setModules(data.modules || []);
      setSignoffs(data.signoffs || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load certifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // State updates occur after the certification request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const dueAudits = useMemo(
    () => signoffs.filter((signoff) => signoff.nextAuditAt && new Date(signoff.nextAuditAt) <= new Date()),
    [signoffs],
  );

  const closeModal = useCallback(() => setOpen(false), []);
  const toggleCheck = (id: string) => setForm((current) => ({
    ...current,
    criticalChecks: current.criticalChecks.includes(id)
      ? current.criticalChecks.filter((value) => value !== id)
      : [...current.criticalChecks, id],
  }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not save practical signoff");
      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save practical signoff");
    } finally {
      setSaving(false);
    }
  };

  const audit = async (signoff: Signoff, result: "PASSED" | "NEEDS_COACHING") => {
    const notes = window.prompt(result === "PASSED" ? "Audit evidence or observation notes" : "What needs another coaching cycle?");
    if (notes === null) return;
    setError("");
    const response = await fetch("/api/admin/certifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: signoff.id, result, notes }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Could not record audit");
      return;
    }
    await load();
  };

  const revoke = async (signoff: Signoff) => {
    const notes = window.prompt("Why is this certification being revoked?");
    if (notes === null) return;
    setError("");
    const response = await fetch("/api/admin/certifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: signoff.userId,
        moduleId: signoff.moduleId,
        status: "REVOKED",
        evidence: "",
        criticalChecks: [],
        notes,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Could not revoke certification");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="shell-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="page-kicker">Observed proof</p>
          <h1 className="page-title">Practical certifications</h1>
          <p className="page-subtitle">Certify live performance, document floor evidence, and run each program&apos;s controlled audit cycle.</p>
        </div>
        <Button onClick={() => { setForm(initialForm); setOpen(true); }}><Plus className="size-4" /> Record signoff</Button>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs font-bold uppercase tracking-wider text-ditch-navy/50">Certified</p><p className="mt-2 text-3xl font-black text-ditch-ink">{signoffs.filter((item) => item.status === "PASSED").length}</p></Card>
        <Card><p className="text-xs font-bold uppercase tracking-wider text-ditch-navy/50">Needs coaching</p><p className="mt-2 text-3xl font-black text-ditch-ink">{signoffs.filter((item) => item.status === "NEEDS_COACHING").length}</p></Card>
        <Card><p className="text-xs font-bold uppercase tracking-wider text-ditch-navy/50">Audits due</p><p className="mt-2 text-3xl font-black text-ditch-ink">{dueAudits.length}</p></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="size-8 animate-spin rounded-full border-2 border-ditch-navy/15 border-b-ditch-orange" /></div>
      ) : signoffs.length === 0 ? (
        <EmptyState icon={Award} title="No practical signoffs yet" description="Record the first observed floor practical when a teammate demonstrates the standard." />
      ) : (
        <div className="space-y-3">
          {signoffs.map((signoff) => (
            <Card key={signoff.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-ditch-ink">{signoff.user?.firstName} {signoff.user?.lastName}</h2>
                  <Badge variant={signoff.status === "PASSED" ? "completed" : signoff.status === "NEEDS_COACHING" ? "in-progress" : "required"}>{signoff.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-ditch-navy">{signoff.module?.title}</p>
                <p className="text-xs text-ditch-navy/50">{signoff.module?.section?.title} · {signoff.user?.position || "Position not set"}</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ditch-navy/70">{signoff.evidence}</p>
                {signoff.nextAuditAt && (
                  <p className="mt-2 text-xs font-bold text-ditch-orange">
                    Next audit: {new Date(signoff.nextAuditAt).toLocaleDateString()} · {Math.min(signoff.auditStep + 1, signoff.auditScheduleDays.length)} of {signoff.auditScheduleDays.length}
                  </p>
                )}
              </div>
              {signoff.status === "PASSED" && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => void revoke(signoff)}><AlertTriangle className="size-4" /> Revoke</Button>
                  {signoff.nextAuditAt && new Date(signoff.nextAuditAt) <= new Date() && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => void audit(signoff, "NEEDS_COACHING")}><RotateCcw className="size-4" /> Coach again</Button>
                      <Button size="sm" onClick={() => void audit(signoff, "PASSED")}><CheckCircle2 className="size-4" /> Pass audit</Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={closeModal} title="Record practical signoff" size="lg">
        <div className="space-y-5">
          <Select id="cert-user" label="Employee" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} options={[{ value: "", label: "Select employee" }, ...users.map((user) => ({ value: user.id, label: `${user.lastName}, ${user.firstName}${user.position ? ` — ${user.position}` : ""}` }))]} />
          <Select id="cert-module" label="Practical" value={form.moduleId} onChange={(event) => setForm({ ...form, moduleId: event.target.value })} options={[{ value: "", label: "Select practical module" }, ...modules.map((module) => ({ value: module.id, label: `${module.section?.title || "Training"} — ${module.title}` }))]} />
          <Select id="cert-status" label="Result" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={[{ value: "PASSED", label: "Passed" }, { value: "NEEDS_COACHING", label: "Needs coaching" }]} />
          <fieldset className="space-y-2 rounded-2xl border border-ditch-navy/10 bg-white p-4">
            <legend className="field-label px-1">Critical checks</legend>
            {checkOptions.map((item) => <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ditch-navy"><input type="checkbox" checked={form.criticalChecks.includes(item.id)} onChange={() => toggleCheck(item.id)} className="size-5 rounded border-ditch-navy/20 text-ditch-orange" />{item.label}</label>)}
          </fieldset>
          <Textarea id="cert-evidence" label="Observed evidence" value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder="What did the teammate do, under what conditions, and what proved transfer?" />
          <Textarea id="cert-notes" label="Coaching notes (optional)" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button disabled={saving} onClick={() => void save()}><ClipboardCheck className="size-4" />{saving ? "Saving…" : "Save signoff"}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
