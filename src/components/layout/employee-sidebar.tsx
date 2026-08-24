"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import { DitchMark } from "@/components/brand/ditch-mark";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  };
}

const navItems = [
  { href: "/dashboard", label: "Home", hint: "Your shift briefing", icon: LayoutDashboard },
  { href: "/training", label: "Playbook", hint: "Training & standards", icon: BookOpen },
  { href: "/menu", label: "Menu Intel", hint: "Food & allergens", icon: Utensils },
  { href: "/search", label: "Ask SpecOS", hint: "Instant answers", icon: Search },
  { href: "/quizzes", label: "Knowledge Checks", hint: "Test your recall", icon: ClipboardCheck },
  { href: "/progress", label: "Scorecard", hint: "See your progress", icon: BarChart3 },
];

export function EmployeeSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const isAdminCapable = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => asideRef.current?.querySelector<HTMLElement>("a")?.focus());
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-ditch-navy/10 bg-ditch-cream/95 px-4 backdrop-blur-xl lg:hidden">
        <DitchMark compact />
        <p className="absolute left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-[0.18em] text-ditch-ink">
          TrainOS
        </p>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="grid size-10 place-items-center rounded-xl border border-ditch-navy/10 bg-white text-ditch-ink"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-ditch-ink/55 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        ref={asideRef}
        aria-hidden={!isDesktop && !mobileOpen ? true : undefined}
        inert={!isDesktop && !mobileOpen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-hidden bg-ditch-navy text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border-[64px] border-white/[0.035]" />
        <div className="relative border-b border-white/10 px-6 py-7">
          <DitchMark inverse />
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-5" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[9px] font-extrabold uppercase tracking-[0.24em] text-white/35">
            Your operating system
          </p>
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-all",
                    isActive
                      ? "bg-white text-ditch-ink shadow-lg"
                      : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                  )}
                >
                  <span className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                    isActive ? "bg-ditch-sand/65 text-ditch-orange" : "bg-white/[0.06] text-white/60 group-hover:text-ditch-seafoam"
                  )}>
                    <item.icon className="size-[18px]" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className={cn("mt-0.5 block truncate text-[10px]", isActive ? "text-ditch-navy/50" : "text-white/35")}>
                      {item.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {isAdminCapable && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl border border-ditch-orange/30 bg-ditch-orange/10 px-3.5 text-sm font-bold text-ditch-sand transition-colors hover:bg-ditch-orange/20"
              >
                <Settings className="size-[18px] text-ditch-orange" />
                Open Control Room
              </Link>
            </div>
          )}
        </nav>

        <div className="relative p-4">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-ditch-seafoam" />
              <p className="text-[11px] font-medium leading-5 text-white/55">
                Make them feel seen. That&apos;s the job.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-ditch-ink/35 p-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ditch-orange text-xs font-black text-white">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user.firstName} {user.lastName}</p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-white/35">
                {user.role.replace("_", " ")}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
