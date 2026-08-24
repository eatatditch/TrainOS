import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDuration, formatDate } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Award, Clock, FileText, Download, Video, Image as ImageIcon, CheckCircle2, ClipboardCheck, Lock, Printer } from "lucide-react";
import { MarkCompleteButton } from "@/components/training/mark-complete-button";
import { ModuleContent } from "@/components/training/module-content";
import {
  canAccessModule,
  canManageTraining,
  getAssignedModuleIds,
} from "@/lib/training-access";
import { createReviewToken } from "@/lib/review-token";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ sectionSlug: string; moduleSlug: string }>;
}) {
  const { sectionSlug, moduleSlug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  const userId = user.id;

  // Fetch the section first to get its ID for filtering
  const { data: sectionData } = await db
    .from("Section")
    .select("id, slug")
    .eq("slug", sectionSlug)
    .single();

  if (!sectionData) notFound();

  const { data: moduleData } = await db
    .from("Module")
    .select("*, section:Section(*), assets:ModuleAsset(*)")
    .eq("slug", moduleSlug)
    .eq("sectionId", sectionData.id)
    .eq("isActive", true)
    .single();

  if (!moduleData) notFound();

  if (!(await canAccessModule(user, moduleData.id))) {
    redirect("/training");
  }

  const trainingModule = {
    ...moduleData,
    assets: (moduleData.assets || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  };

  // Fetch all modules in section for sequential order + next module navigation
  const { data: allSectionModules } = await db
    .from("Module")
    .select("id, sortOrder, slug, title")
    .eq("sectionId", sectionData.id)
    .eq("isActive", true)
    .order("sortOrder");

  let sortedModules = (allSectionModules || []).sort(
    (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  if (!canManageTraining(user)) {
    const assignedModuleIds = await getAssignedModuleIds(user.id);
    sortedModules = sortedModules.filter((item: any) =>
      assignedModuleIds.has(item.id),
    );
  }
  const currentIndex = sortedModules.findIndex((m: any) => m.id === trainingModule.id);
  const nextModule = currentIndex >= 0 && currentIndex < sortedModules.length - 1
    ? sortedModules[currentIndex + 1]
    : null;
  const isLastModule = currentIndex === sortedModules.length - 1;

  // Enforce sequential module order — a lesson review alone is not mastery.
  // The current-version module check must also be passed.
  if (!canManageTraining(user) && currentIndex > 0) {
    const prevModule = sortedModules[currentIndex - 1];
    const [{ data: prevCompletion }, { data: prevQuiz }] = await Promise.all([
      db
        .from("ModuleCompletion")
        .select("id")
        .eq("userId", userId)
        .eq("moduleId", prevModule.id)
        .limit(1),
      db
        .from("Quiz")
        .select("id, assessmentVersion")
        .eq("moduleId", prevModule.id)
        .eq("quizType", "MODULE")
        .eq("isActive", true)
        .maybeSingle(),
    ]);
    const { data: previousPass } = prevQuiz
      ? await db
          .from("QuizAttempt")
          .select("id")
          .eq("userId", userId)
          .eq("quizId", prevQuiz.id)
          .eq("assessmentVersion", prevQuiz.assessmentVersion)
          .eq("passed", true)
          .limit(1)
      : { data: [] };

    if (
      !prevCompletion ||
      prevCompletion.length === 0 ||
      !previousPass ||
      previousPass.length === 0
    ) {
      redirect(`/training/${sectionSlug}`);
    }
  }

  let isCompleted = false;
  if (userId) {
    const { data: completionData } = await db
      .from("ModuleCompletion")
      .select("id")
      .eq("userId", userId)
      .eq("moduleId", trainingModule.id)
      .limit(1);
    isCompleted = (completionData || []).length > 0;
  }

  const { data: moduleQuiz, error: moduleQuizError } = await db
    .from("Quiz")
    .select("id, title, description, passingScore, retryLimit, assessmentVersion, questions:QuizQuestion(id)")
    .eq("moduleId", trainingModule.id)
    .eq("quizType", "MODULE")
    .eq("isActive", true)
    .maybeSingle();
  if (moduleQuizError) throw new Error("Unable to load the module check");

  const { data: moduleQuizAttempts, error: moduleQuizAttemptsError } = moduleQuiz
    ? await db
        .from("QuizAttempt")
        .select("id, score, passed, completedAt")
        .eq("userId", userId)
        .eq("quizId", moduleQuiz.id)
        .eq("assessmentVersion", moduleQuiz.assessmentVersion)
        .order("completedAt", { ascending: false })
    : { data: [], error: null };
  if (moduleQuizAttemptsError) throw new Error("Unable to load module check attempts");
  const moduleCheckAttempts = moduleQuizAttempts || [];
  const hasPassedModuleQuiz = moduleCheckAttempts.some((attempt) => attempt.passed);
  const moduleMastered = isCompleted && hasPassedModuleQuiz;

  const requiresPractical = (trainingModule.tags || []).includes("practical-required");
  const { data: practicalSignoff } = requiresPractical
    ? await db.from("PracticalSignoff").select("status, signedAt, nextAuditAt").eq("userId", userId).eq("moduleId", trainingModule.id).maybeSingle()
    : { data: null };

  const review = !isCompleted
    ? createReviewToken(user.id, trainingModule.id, user.skipReviewTimer)
    : null;

  const videos = trainingModule.assets.filter((a: any) => a.fileType === "VIDEO");
  const documents = trainingModule.assets.filter((a: any) => ["PDF", "DOCUMENT", "CHECKLIST"].includes(a.fileType));
  const images = trainingModule.assets.filter((a: any) => a.fileType === "IMAGE");
  const printables = trainingModule.assets.filter((a: any) => a.isPrintable);

  return (
    <article className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      <header className="relative overflow-hidden rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
      <div className="flex items-start gap-4">
        <Link
          href={`/training/${sectionSlug}`}
          aria-label="Back to training stage"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-5 text-white/70" />
        </Link>
        <div className="flex-1">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ditch-seafoam">{trainingModule.section?.title}</p>
          <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">{trainingModule.title}</h1>
        </div>
        {isCompleted && (
          <Badge variant="completed" className="flex items-center gap-1 px-3 py-1">
            <CheckCircle2 className="w-4 h-4" /> {requiresPractical ? "Lesson reviewed" : "Completed"}
          </Badge>
        )}
      </div>

      {/* Meta Info */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        {trainingModule.isRequired && <Badge variant="required">Required</Badge>}
        {trainingModule.estimatedMinutes && (
          <span className="flex items-center gap-1 text-xs font-bold text-white/55">
            <Clock className="size-4" /> {formatDuration(trainingModule.estimatedMinutes)}
          </span>
        )}
        {trainingModule.tags.length > 0 && trainingModule.tags.map((tag: string) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      </header>

      {/* Description */}
      {trainingModule.description && (
        <Card className="border-l-4 border-l-ditch-orange">
          <p className="text-base font-medium leading-7 text-ditch-navy/75">{trainingModule.description}</p>
        </Card>
      )}

      {/* Structured Content */}
      <ModuleContent fallbackHtml={trainingModule.content} />

      {requiresPractical && (
        <Card className={`border-l-4 ${practicalSignoff?.status === "PASSED" ? "border-l-ditch-green bg-ditch-seafoam/15" : practicalSignoff?.status === "NEEDS_COACHING" ? "border-l-ditch-orange bg-ditch-sand/25" : "border-l-ditch-orange bg-white"}`}>
          <div className="flex items-start gap-3">
            <Award className="mt-0.5 size-5 shrink-0 text-ditch-orange" />
            <div>
              <h2 className="font-extrabold text-ditch-ink">
                {practicalSignoff?.status === "PASSED" ? "Practical certified" : practicalSignoff?.status === "NEEDS_COACHING" ? "Another coached rep is required" : isCompleted ? "Lesson reviewed — practical signoff pending" : "This module requires observed floor proof"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-ditch-navy/65">
                {practicalSignoff?.status === "PASSED"
                  ? `Certified${practicalSignoff.signedAt ? ` ${formatDate(practicalSignoff.signedAt)}` : ""}.${practicalSignoff.nextAuditAt ? ` Next audit: ${formatDate(practicalSignoff.nextAuditAt)}.` : " Audit cycle complete."}`
                  : "Completing the lesson records review only. A manager must observe the live practical, document evidence, and record the certification separately."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ditch-ink">
            <Video className="w-5 h-5 text-ditch-orange" /> Training Videos
          </h2>
          <div className="space-y-4">
            {videos.map((video: any) => (
              <div key={video.id} className="rounded-xl overflow-hidden">
                <video
                  controls
                  preload="metadata"
                  className="w-full rounded-xl bg-gray-900"
                  poster=""
                >
                  <source src={video.fileUrl} type={
                    video.fileName?.endsWith(".mp4") ? "video/mp4" :
                    video.fileName?.endsWith(".webm") ? "video/webm" :
                    video.fileName?.endsWith(".mov") ? "video/quicktime" :
                    "video/mp4"
                  } />
                  Your browser does not support the video tag.
                </video>
                <p className="text-sm text-gray-500 mt-2">{video.fileName}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Images */}
      {images.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-ditch-orange" /> Photos & Images
          </h2>
          <div className="space-y-4">
            {images.map((img: any) => (
              <div key={img.id}>
                <Image
                  src={img.fileUrl}
                  alt={img.fileName}
                  width={1200}
                  height={800}
                  sizes="(max-width: 1024px) 100vw, 900px"
                  unoptimized
                  className="h-auto w-full rounded-2xl border border-ditch-navy/10"
                />
                <p className="text-sm text-gray-500 mt-2">{img.fileName}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents — PDFs inline, others as download */}
      {documents.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ditch-ink">
            <FileText className="w-5 h-5 text-ditch-orange" /> Documents & Files
          </h2>
          <div className="space-y-4">
            {documents.map((doc: any) => {
              const isPdf = doc.fileName?.toLowerCase().endsWith(".pdf") || doc.fileType === "PDF";
              return (
                <div key={doc.id}>
                  {isPdf ? (
                    <div>
                      <iframe
                        src={`${doc.fileUrl}#toolbar=1&navpanes=0`}
                        className="w-full rounded-lg border border-gray-200"
                        style={{ height: "600px" }}
                        title={doc.fileName}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-500">{doc.fileName}</p>
                        <div className="flex items-center gap-2">
                          <a href={doc.fileUrl} target="_blank" className="text-xs text-ditch-orange hover:underline">
                            Open in new tab
                          </a>
                          <a href={`${doc.fileUrl}?download=1`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                            <Download className="w-4 h-4 text-gray-400" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-ditch-navy" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500 capitalize">{doc.fileType.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={doc.fileUrl} target="_blank" className="text-xs text-ditch-orange hover:underline">
                          View
                        </a>
                        <a href={`${doc.fileUrl}?download=1`} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4 text-gray-500" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Mark Complete */}
      {!isCompleted && review && (
        <div className="flex justify-end">
          <MarkCompleteButton
            moduleId={trainingModule.id}
            reviewToken={review.token}
            eligibleAt={review.eligibleAt}
            skipReviewTimer={user.skipReviewTimer}
            completionLabel={requiresPractical ? "Finish lesson review" : "Mark as complete"}
          />
        </div>
      )}

      {moduleQuiz ? (
        <Card className={`border-l-4 ${
          hasPassedModuleQuiz
            ? "border-l-ditch-green bg-ditch-seafoam/15"
            : isCompleted
              ? "border-l-ditch-orange"
              : "border-l-ditch-navy/20 bg-ditch-navy/[0.03]"
        }`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {isCompleted ? (
                <ClipboardCheck className={`mt-0.5 size-5 shrink-0 ${hasPassedModuleQuiz ? "text-ditch-green" : "text-ditch-orange"}`} />
              ) : (
                <Lock className="mt-0.5 size-5 shrink-0 text-ditch-navy/35" />
              )}
              <div>
                <p className="page-kicker">Module mastery</p>
                <h2 className="font-extrabold text-ditch-ink">{moduleQuiz.title}</h2>
                <p className="mt-1 text-sm leading-6 text-ditch-navy/60">
                  {hasPassedModuleQuiz
                    ? "Knowledge check passed. This module is mastered."
                    : isCompleted
                      ? `Complete all ${(moduleQuiz.questions || []).length} questions and score ${moduleQuiz.passingScore}% or higher to unlock the next module.`
                      : "Finish the lesson review to unlock this ten-question knowledge check."}
                </p>
                {moduleCheckAttempts.length > 0 ? (
                  <p className="mt-2 text-xs font-bold text-ditch-navy/45">
                    Best score: {Math.max(...moduleCheckAttempts.map((attempt) => attempt.score))}% · {moduleCheckAttempts.length}/{moduleQuiz.retryLimit || "∞"} attempts
                  </p>
                ) : null}
              </div>
            </div>
            {isCompleted && !hasPassedModuleQuiz ? (
              <Link href={`/quizzes/${moduleQuiz.id}`} className="btn-primary shrink-0">
                {moduleCheckAttempts.length > 0 ? "Retry Check" : "Start Check"}
              </Link>
            ) : hasPassedModuleQuiz ? (
              <Badge variant="completed" className="shrink-0">Mastered</Badge>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Printable section */}
      {printables.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Printer className="w-5 h-5 text-ditch-orange" /> Printable Materials
          </h2>
          <div className="space-y-2">
            {printables.map((doc: any) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-ditch-green" />
                  <span className="text-sm font-medium text-gray-900">{doc.fileName}</span>
                </div>
                <span className="text-xs text-ditch-orange">Print</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Next Module / Back to Section Navigation */}
      <div className="flex justify-end pt-2">
        {nextModule && (moduleMastered || canManageTraining(user)) ? (
          <Link
            href={`/training/${sectionSlug}/${nextModule.slug}`}
            className="btn-secondary"
          >
            Next Module <ArrowRight className="w-4 h-4" />
          </Link>
        ) : isLastModule && (moduleMastered || canManageTraining(user)) ? (
          <Link
            href={`/training/${sectionSlug}`}
            className="btn-secondary"
          >
            Back to Section <ArrowRight className="w-4 h-4" />
          </Link>
        ) : moduleQuiz && isCompleted && !hasPassedModuleQuiz ? (
          <Link href={`/quizzes/${moduleQuiz.id}`} className="btn-secondary">
            Pass Module Check <ArrowRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
