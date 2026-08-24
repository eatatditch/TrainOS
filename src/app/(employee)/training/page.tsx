import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BookOpen, Users, Coffee, UtensilsCrossed, Shield,
  ClipboardList, Wine, AlertCircle, Heart, CheckCircle2,
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

  const { data: activeAssessments, error: assessmentsError } = await db
    .from("Quiz")
    .select("id, quizType, moduleId, sectionId, assessmentVersion")
    .eq("isActive", true)
    .in("quizType", ["MODULE", "SECTION"]);
  if (assessmentsError) throw new Error("Unable to load curriculum mastery");

  const assessmentIds = (activeAssessments || []).map((quiz) => quiz.id);
  const { data: passedAttempts, error: attemptsError } = assessmentIds.length > 0
    ? await db
        .from("QuizAttempt")
        .select("quizId, assessmentVersion")
        .eq("userId", userId)
        .eq("passed", true)
        .in("quizId", assessmentIds)
    : { data: [], error: null };
  if (attemptsError) throw new Error("Unable to load current assessment progress");

  const versionByQuiz = new Map(
    (activeAssessments || []).map((quiz) => [quiz.id, quiz.assessmentVersion]),
  );
  const passedQuizIds = new Set(
    (passedAttempts || [])
      .filter(
        (attempt) =>
          versionByQuiz.get(attempt.quizId) === attempt.assessmentVersion,
      )
      .map((attempt) => attempt.quizId),
  );
  const moduleQuizByModuleId = new Map(
    (activeAssessments || [])
      .filter((quiz) => quiz.quizType === "MODULE" && quiz.moduleId)
      .map((quiz) => [quiz.moduleId as string, quiz]),
  );
  const sectionQuizBySectionId = new Map(
    (activeAssessments || [])
      .filter((quiz) => quiz.quizType === "SECTION" && quiz.sectionId)
      .map((quiz) => [quiz.sectionId as string, quiz]),
  );
  const masteredModuleIds = new Set(
    Array.from(completedIds).filter((moduleId) => {
      const moduleQuiz = moduleQuizByModuleId.get(moduleId);
      return !!moduleQuiz && passedQuizIds.has(moduleQuiz.id);
    }),
  );

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

  // Each assigned position is an independent program. A user carrying two jobs
  // can work either path without one position cross-locking the other.
  const sectionComplete = (section: any) => {
    const sectionQuiz = sectionQuizBySectionId.get(section.id);
    return section.modules.length > 0 &&
      section.modules.every((module: any) => masteredModuleIds.has(module.id)) &&
      !!sectionQuiz &&
      passedQuizIds.has(sectionQuiz.id);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] border border-ditch-navy/10 bg-white/85 p-6 shadow-[var(--shadow-surf)] sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-16 size-52 rounded-full bg-ditch-seafoam/25 blur-2xl" />
        <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className="page-kicker">The Ditch playbook</p>
          <h1 className="page-title">Learn it. Practice it. Own it.</h1>
          <p className="page-subtitle">Work through each assigned program. Every module check builds toward that position&apos;s final.</p>
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
          const completedModules = section.modules.filter((m: any) => masteredModuleIds.has(m.id)).length;
          const isComplete = sectionComplete(section);

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
                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-ditch-orange">Program {String(index + 1).padStart(2, "0")}</p>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold tracking-tight text-ditch-ink">{section.title}</h3>
                      {isComplete && <Badge variant="completed">Complete</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-ditch-navy/55">{section.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[11px] font-medium text-ditch-navy/45">{totalModules} modules</span>
                      {completedModules > 0 && !isComplete && (
                        <Badge variant="in-progress">{completedModules}/{totalModules} mastered</Badge>
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
