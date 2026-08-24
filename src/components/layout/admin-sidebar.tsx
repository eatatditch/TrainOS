"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import { DitchMark } from "@/components/brand/ditch-mark";
import {
  ArrowLeft,
  Award,
  BarChart3,
  ClipboardCheck,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Route,
  Utensils,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

const navItems = [
  { href: "/admin", label: "Control Room", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Playbook", icon: FileText, adminOnly: true },
  { href: "/admin/quizzes", label: "Knowledge Checks", icon: ClipboardCheck, adminOnly: true },
  { href: "/admin/menu", label: "Menu Intel", icon: Utensils },
  { href: "/admin/certifications", label: "Certifications", icon: Award },
  { href: "/admin/employees", label: "Crew", icon: Users, adminOnly: true },
  { href: "/admin/paths", label: "Learning Paths", icon: Route, adminOnly: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/announcements", label: "Team Updates", icon: Megaphone, adminOnly: true },
  { href: "/admin/media", label: "Asset Library", icon: Image, adminOnly: true },
];

export function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);

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
        <DitchMark compact product="Control" />
        <p className="absolute left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-[0.18em] text-ditch-ink">
          Control
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
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-hidden bg-ditch-ink text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border-[64px] border-ditch-orange/[0.055]" />
        <div className="relative border-b border-white/10 px-6 py-7">
          <DitchMark inverse product="Control" />
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
          <p className="mb-3 px-3 text-[9px] font-extrabold uppercase tracking-[0.24em] text-white/35">
            Run the standard
          </p>
          <div className="space-y-1">
            {navItems.filter((item) => !item.adminOnly || user.role !== "MANAGER").map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition-all",
                    isActive
                      ? "bg-ditch-orange text-white shadow-[0_8px_24px_rgba(216,95,42,0.22)]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <item.icon className={cn("size-[18px]", isActive ? "text-white" : "text-white/40 group-hover:text-ditch-seafoam")} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-bold text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft className="size-[18px]" />
              Back to TrainOS
            </Link>
          </div>
        </nav>

        <div className="relative p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
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
              className="grid size-9 place-items-center rounded-xl text-white/35 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
