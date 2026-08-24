import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BookOpen, Users, Coffee, UtensilsCrossed, Shield,
  ClipboardList, Wine, AlertCircle, Heart, Lock, CheckCircle2,
} from "lucide-react";
import { PalomaMan } from "@/components/paloma-man";
import { canManageTraining, getAssignedModuleIds } from "@/lib/training-access";

const sectionIcons: Record<string, any> = {
  "brand-culture": Heart,
  "server-training": UtensilsCrossed,
  "bartender-training": Wine,
  "support-staff-training": Users,
  "safety-sanitation-security": Shield,
  "menu-knowledge": Coffee,
  "opening-closing-procedures": ClipboardList,
  "alcohol-awareness": AlertCircle,
};

export default async function TrainingLibraryPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const userId = user.id;
  const isAdmin = canManageTraining(user);
  const assignedModuleIds = isAdmin
    ? new Set<string>()
    : await getAssignedModuleIds(user.id);

  // If no paths assigned and not admin, show empty state
  if (assignedModuleIds.size === 0 && !isAdmin) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <p className="page-kicker">The Ditch playbook</p>
          <h1 className="page-title">Your training lineup</h1>
          <p className="page-subtitle">The standards and skills assigned to your role will show up here.</p>
        </div>
        <EmptyState
          icon={BookOpen}
          title="No Training Assigned"
          description="Your manager hasn't assigned a training path yet. Check back soon or contact your manager."
        />
      </div>
    );
  }

  // Fetch all sections with modules
  const { data: allSections } = await db
    .from("Section")
    .select("*, modules:Module(*)")
    .eq("isActive", true)
    .order("sortOrder");

  // Fetch completions
  const { data: completionsData } = await db
    .from("ModuleCompletion")
    .select("*")
    .eq("userId", userId);

  const completedIds = new Set((completionsData || []).map((c: any) => c.moduleId));

  // Filter sections: only include sections that have at least one assigned module
  // Admins see everything
  const sections = (allSections || [])
    .map((section: any) => {
      const activeModules = (section.modules || [])
        .filter((m: any) => m.isActive)
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      // For non-admins, only include modules that are in their assigned training paths
      const visibleModules = isAdmin
        ? activeModules
        : activeModules.filter((m: any) => assignedModuleIds.has(m.id));

      return { ...section, modules: visibleModules };
    })
    .filter((section: any) => section.modules.length > 0);

  // Section completion check
  const sectionComplete = (section: any) =>
    section.modules.length > 0 && section.modules.every((m: any) => completedIds.has(m.id));

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] border border-ditch-navy/10 bg-white/85 p-6 shadow-[var(--shadow-surf)] sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-16 size-52 rounded-full bg-ditch-seafoam/25 blur-2xl" />
        <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className="page-kicker">The Ditch playbook</p>
          <h1 className="page-title">Learn it. Practice it. Own it.</h1>
          <p className="page-subtitle">Work through your lineup in order. These are the reps that turn standards into muscle memory.</p>
        </div>
        <div className="hidden sm:block shrink-0">
          <PalomaMan size="sm" message="One rep at a time. Consistency is the cheat code." />
        </div>
        </div>
        <div className="relative mt-7 surf-rule" />
      </section>

      <div className="space-y-3">
        {sections.map((section: any, index: number) => {
          const Icon = sectionIcons[section.slug] || BookOpen;
          const totalModules = section.modules.length;
          const completedModules = section.modules.filter((m: any) => completedIds.has(m.id)).length;
          const isComplete = sectionComplete(section);
          const previousComplete = index === 0 || sectionComplete(sections[index - 1]);
          const isAccessible = isAdmin || isComplete || previousComplete;

          if (!isAccessible) {
            return (
              <Card key={section.id} className="border-dashed bg-white/50 opacity-65 shadow-none">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ditch-navy/[0.05]">
                    <Lock className="size-5 text-ditch-navy/35" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-ditch-navy/35">Stage {String(index + 1).padStart(2, "0")} · Locked</p>
                    <h3 className="font-extrabold text-ditch-navy/45">{section.title}</h3>
                    <p className="mt-1 text-xs text-ditch-navy/35">Finish the previous stage to unlock · {totalModules} modules</p>
                  </div>
                </div>
              </Card>
            );
          }

          return (
            <Link key={section.id} href={`/training/${section.slug}`}>
              <Card hover className="group h-full overflow-hidden p-0">
                <div className="flex items-stretch">
                  <div className={`grid w-16 shrink-0 place-items-center sm:w-20 ${isComplete ? "bg-ditch-seafoam/30" : "bg-ditch-sand/55"}`}>
                    {isComplete ? (
                      <CheckCircle2 className="size-6 text-ditch-green" />
                    ) : (
                      <Icon className="size-6 text-ditch-orange" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-4 sm:p-5">
                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-ditch-orange">Stage {String(index + 1).padStart(2, "0")}</p>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold tracking-tight text-ditch-ink">{section.title}</h3>
                      {isComplete && <Badge variant="completed">Complete</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-ditch-navy/55">{section.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[11px] font-medium text-ditch-navy/45">{totalModules} modules</span>
                      {completedModules > 0 && !isComplete && (
                        <Badge variant="in-progress">{completedModules}/{totalModules} done</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
