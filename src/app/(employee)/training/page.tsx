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
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role);

  // Fetch employee's assigned training paths and their modules
  const { data: userPaths } = await db
    .from("UserTrainingPath")
    .select("trainingPathId, trainingPath:TrainingPath(id, title, modules:TrainingPathModule(moduleId))")
    .eq("userId", userId);

  // Collect all assigned module IDs from training paths
  const assignedModuleIds = new Set<string>();
  const assignedSectionIds = new Set<string>();

  (userPaths || []).forEach((up: any) => {
    (up.trainingPath?.modules || []).forEach((tpm: any) => {
      if (tpm.moduleId) assignedModuleIds.add(tpm.moduleId);
    });
  });

  // If no paths assigned and not admin, show empty state
  if (assignedModuleIds.size === 0 && !isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Library</h1>
          <p className="text-gray-500 mt-1">Your assigned training content</p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Library</h1>
        <p className="text-gray-500 mt-1">Complete each section in order to progress through your training</p>
      </div>

      <div className="space-y-3">
        {sections.map((section: any, index: number) => {
          const Icon = sectionIcons[section.slug] || BookOpen;
          const totalModules = section.modules.length;
          const completedModules = section.modules.filter((m: any) => completedIds.has(m.id)).length;
          const isComplete = sectionComplete(section);
          const previousComplete = index === 0 || sectionComplete(sections[index - 1]);
          const isAccessible = isComplete || previousComplete;

          if (!isAccessible) {
            return (
              <Card key={section.id} className="opacity-50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl shrink-0">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-400">{section.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">Complete the previous section to unlock</p>
                    <span className="text-xs text-gray-400">{totalModules} modules</span>
                  </div>
                </div>
              </Card>
            );
          }

          return (
            <Link key={section.id} href={`/training/${section.slug}`}>
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${isComplete ? "bg-ditch-green/10" : "bg-ditch-orange/10"}`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-ditch-green" />
                    ) : (
                      <Icon className="w-6 h-6 text-ditch-orange" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      {isComplete && <Badge variant="completed">Complete</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-gray-400">{totalModules} modules</span>
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
