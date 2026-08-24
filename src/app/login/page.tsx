"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DitchMark } from "@/components/brand/ditch-mark";
import { BookOpenCheck, HeartHandshake, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("We couldn't start your session. Please try again.");
        setLoading(false);
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-ditch-navy lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="absolute -right-32 -top-28 size-[34rem] rounded-full border-[100px] border-ditch-seafoam/10" />
        <div className="absolute -bottom-48 -left-24 size-[38rem] rounded-full border-[120px] border-ditch-orange/10" />
        <div className="relative z-10">
          <DitchMark inverse />
        </div>

        <div className="relative z-10 my-auto max-w-2xl py-16">
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.26em] text-ditch-seafoam">
            Hospitality is the product
          </p>
          <h1 className="max-w-xl text-5xl font-black leading-[0.98] tracking-[-0.055em] xl:text-7xl">
            Every shift starts here.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/65 xl:text-lg">
            One operating system for the standards, menu knowledge, and hospitality habits that make Ditch feel like Ditch.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: HeartHandshake, label: "Own the welcome" },
              { icon: BookOpenCheck, label: "Know the menu" },
              { icon: ShieldCheck, label: "Protect the guest" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <Icon className="mb-3 size-5 text-ditch-seafoam" />
                <p className="text-xs font-bold leading-5 text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
          Tacos · Tequila · Beach Food · Unreasonable Hospitality
        </p>
      </section>

      <section className="app-canvas flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10 lg:hidden">
            <DitchMark />
          </div>

          <div className="mb-8">
            <p className="page-kicker">Team sign in</p>
            <h2 className="text-4xl font-black tracking-[-0.05em] text-ditch-ink">Ready when you are.</h2>
            <p className="mt-3 text-sm leading-6 text-ditch-navy/60">
              Pick up where you left off and get shift-ready.
            </p>
          </div>

          <div className="shell-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              <Input
                id="email"
                label="Work email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@eatatditch.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Getting things ready…" : "Enter TrainOS"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-ditch-navy/45">
            Ditch team access only. Need help signing in? Ask a manager.
          </p>
        </div>
      </section>
    </main>
  );
}
