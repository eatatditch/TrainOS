"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("The passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Unable to update your password");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to update your password. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="shell-card p-6 sm:p-8">
      <div className="mb-7">
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-ditch-sand/60 text-ditch-orange">
          <KeyRound className="size-5" />
        </span>
        <p className="page-kicker">Account security</p>
        <h1 className="text-3xl font-black tracking-[-0.045em] text-ditch-ink">
          Set a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-ditch-navy/60">
          Replace your temporary or historical password before continuing to TrainOS.
        </p>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-ditch-seafoam/35 bg-ditch-seafoam/10 p-4 text-sm leading-6 text-ditch-navy/70">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ditch-green" />
        <p>Use at least 12 characters and do not reuse the old Ditch default password.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <Input
          id="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Input
          id="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Securing your account…" : "Save password and continue"}
        </Button>
      </form>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="mx-auto mt-6 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-ditch-navy/45 transition-colors hover:bg-ditch-navy/[0.06] hover:text-ditch-navy"
      >
        <LogOut className="size-4" />
        {signingOut ? "Signing out…" : "Sign out instead"}
      </button>
    </div>
  );
}

