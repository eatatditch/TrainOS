"use client";

import { useState } from "react";
import { SearchCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DitchMark } from "@/components/brand/ditch-mark";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <main className="app-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-ditch-navy" />
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex justify-center">
          <DitchMark inverse product="SpecOS" />
        </div>
        <div className="shell-card p-6 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-ditch-sand/60 text-ditch-orange">
              <SearchCheck className="size-5" />
            </div>
            <p className="page-kicker">On-shift answers</p>
            <h1 className="text-3xl font-black tracking-[-0.045em] text-ditch-ink">Ask SpecOS</h1>
            <p className="mt-2 text-sm leading-6 text-ditch-navy/55">Sign in with your Ditch team account.</p>
          </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">{error}</div>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="min-h-12 w-full rounded-xl border border-ditch-navy/15 bg-white px-4 py-3 text-sm text-ditch-ink outline-none transition-colors placeholder:text-ditch-navy/35 focus:border-ditch-orange"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="min-h-12 w-full rounded-xl border border-ditch-navy/15 bg-white px-4 py-3 text-sm text-ditch-ink outline-none transition-colors placeholder:text-ditch-navy/35 focus:border-ditch-orange"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Getting answers ready…" : "Enter SpecOS"}
          </button>
        </form>
        </div>
        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-ditch-navy/35">Ditch team access only</p>
      </div>
    </main>
  );
}
