import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDuration, formatDate } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, FileText, Video, Image as ImageIcon, ClipboardCheck, Lock } from "lucide-react";

export default async function SectionPage({ params }: { params: Promise<{ sectionSlug: string }> }) {
  const { sectionSlug } = await params;
  const user = await getUser();
  const userId = user?.id;

  const isAdmin = user ? ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role) : false;

  // Fetch section with modules
  const { data: sectionData } = await db
    .from("Section")
    .select("*, modules:Module(*, assets:ModuleAsset(*))")
    .eq("slug", sectionSlug)
    .eq("isActive", true)
    .single();

  if (!sectionData) notFound();

  // Check if employee is assigned to any training path that includes modules in this section
  if (userId && !isAdmin) {
    const { data: userPaths } = await db
      .from("UserTrainingPath")
      .select("trainingPath:TrainingPath(modules:TrainingPathModule(moduleId))")
      .eq("userId", userId);

    const assignedModuleIds = new Set<string>();
    (userPaths || []).forEach((up: any) => {
      (up.trainingPath?.modules || []).forEach((tpm: any) => {
        if (tpm.moduleId) assignedModuleIds.add(tpm.moduleId);
      });
    });

    const sectionModuleIds = (sectionData.modules || []).map((m: any) => m.id);
    const hasAssignedModule = sectionModuleIds.some((id: string) => assignedModuleIds.has(id));

    if (!hasAssignedModule) {
      redirect("/training");
    }
  }

  // Enforce sequential section order — check if previous section is complete
  if (userId) {
    const { data: allSections } = await db
      .from("Section")
      .select("id, slug, sortOrder, modules:Module(id)")
      .eq("isActive", true)
      .order("sortOrder");

    const sortedSections = (allSections || []).map((s: any) => ({
      ...s,
      modules: (s.modules || []),
    }));

    const currentIdx = sortedSections.findIndex((s: any) => s.id === sectionData.id);

    if (currentIdx > 0) {
      const prevSection = sortedSections[currentIdx - 1];
      const prevModuleIds = prevSection.modules.map((m: any) => m.id);

      if (prevModuleIds.length > 0) {
        const { data: prevCompletions } = await db
          .from("ModuleCompletion")
          .select("moduleId")
          .eq("userId", userId)
          .in("moduleId", prevModuleIds);

        const prevCompletedCount = new Set((prevCompletions || []).map((c: any) => c.moduleId)).size;
        if (prevCompletedCount < prevModuleIds.length) {
          redirect("/training");
        }
      }
    }
  }

  const section = {
    ...sectionData,
    modules: (sectionData.modules || [])
      .filter((m: any) => m.isActive)
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  };

  // Fetch section-level quiz
  const { data: sectionQuiz } = await db
    .from("Quiz")
    .select("*, questions:QuizQuestion(*)")
    .eq("sectionId", sectionData.id)
    .limit(1)
    .maybeSingle();

  // Fetch completions
  const completions = userId
    ? await (async () => {
        const moduleIds = section.modules.map((m: any) => m.id);
        if (moduleIds.length === 0) return [];
        const { data } = await db.from("ModuleCompletion").select("*").eq("userId", userId).in("moduleId", moduleIds);
        return data || [];
      })()
    : [];

  const completedIds = new Set(completions.map((c: any) => c.moduleId));
  const completedCount = section.modules.filter((m: any) => completedIds.has(m.id)).length;
  const allModulesComplete = completedCount === section.modules.length && section.modules.length > 0;

  // Fetch quiz attempts if quiz exists
  let quizAttempts: any[] = [];
  if (userId && sectionQuiz) {
    const { data: attempts } = await db
      .from("QuizAttempt")
      .select("*")
      .eq("userId", userId)
      .eq("quizId", sectionQuiz.id)
      .order("completedAt", { ascending: false });
    quizAttempts = attempts || [];
  }
  const hasPassed = quizAttempts.some((a: any) => a.passed);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/training" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
          <p className="text-gray-500 mt-1">{section.description}</p>
        </div>
      </div>

      {section.modules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Section Progress</span>
            <span className="text-sm text-gray-500">{completedCount} of {section.modules.length} completed</span>
          </div>
          <ProgressBar value={completedCount} max={section.modules.length} showLabel={false} />
        </div>
      )}

      {/* Module List — Sequential Order Enforced */}
      <div className="space-y-3">
        {section.modules.map((mod: any, index: number) => {
          const isCompleted = completedIds.has(mod.id);
          const previousCompleted = index === 0 || completedIds.has(section.modules[index - 1].id);
          const isAccessible = isCompleted || previousCompleted;
          const hasVideo = (mod.assets || []).some((a: any) => a.fileType === "VIDEO");
          const hasPDF = (mod.assets || []).some((a: any) => a.fileType === "PDF" || a.fileType === "DOCUMENT" || a.fileType === "CHECKLIST");
          const hasImages = (mod.assets || []).some((a: any) => a.fileType === "IMAGE");

          if (!isAccessible) {
            return (
              <Card key={mod.id} className="flex items-center gap-4 opacity-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-400 truncate">{mod.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">Complete the previous module to unlock</p>
                </div>
              </Card>
            );
          }

          return (
            <Link key={mod.id} href={`/training/${sectionSlug}/${mod.slug}`}>
              <Card hover className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-ditch-green text-white" : "bg-ditch-orange/10 text-ditch-orange"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{mod.title}</h3>
                    {mod.isRequired && <Badge variant="required">Required</Badge>}
                    {isCompleted && <Badge variant="completed">Complete</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{mod.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {mod.estimatedMinutes && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(mod.estimatedMinutes)}
                      </span>
                    )}
                    {hasVideo && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    )}
                    {hasPDF && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Documents
                      </span>
                    )}
                    {hasImages && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Photos
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Section Quiz — at the bottom, gated by module completion */}
      {sectionQuiz && (
        <div className="pt-2">
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-ditch-orange" />
              Section Quiz
            </h2>

            {allModulesComplete ? (
              <Card className={`border-l-4 ${hasPassed ? "border-l-ditch-green bg-green-50/30" : "border-l-ditch-orange"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sectionQuiz.title}</h3>
                    {sectionQuiz.description && (
                      <p className="text-sm text-gray-500 mt-1">{sectionQuiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{(sectionQuiz.questions || []).length} questions</span>
                      <span>Passing: {sectionQuiz.passingScore}%</span>
                      {sectionQuiz.retryLimit > 0 && <span>Max attempts: {sectionQuiz.retryLimit}</span>}
                    </div>
                    {hasPassed && (
                      <div className="flex items-center gap-2 mt-3">
                        <CheckCircle2 className="w-4 h-4 text-ditch-green" />
                        <span className="text-sm font-medium text-ditch-green">Passed</span>
                      </div>
                    )}
                  </div>
                </div>

                {quizAttempts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Attempts ({quizAttempts.length})</p>
                    <div className="space-y-2">
                      {quizAttempts.slice(0, 3).map((attempt: any) => (
                        <div key={attempt.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{attempt.completedAt ? formatDate(attempt.completedAt) : "In progress"}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{attempt.score}%</span>
                            <Badge variant={attempt.passed ? "completed" : "required"}>
                              {attempt.passed ? "Passed" : "Failed"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    href={`/quizzes/${sectionQuiz.id}`}
                    className="inline-flex items-center gap-2 bg-ditch-orange text-white px-6 py-2.5 rounded-lg font-medium hover:bg-ditch-orange/90 transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {hasPassed ? "Review Quiz" : quizAttempts.length > 0 ? "Retake Quiz" : "Start Quiz"}
                  </Link>
                </div>
              </Card>
            ) : (
              <Card className="border-l-4 border-l-gray-300 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-200 rounded-full">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-500">{sectionQuiz.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Complete all {section.modules.length} modules in this section to unlock the quiz.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {completedCount} of {section.modules.length} modules completed
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
