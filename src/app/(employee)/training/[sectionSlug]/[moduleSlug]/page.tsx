import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Clock, FileText, Download, Video, Image as ImageIcon, CheckCircle2, Printer } from "lucide-react";
import { MarkCompleteButton } from "@/components/training/mark-complete-button";
import { ModuleContent } from "@/components/training/module-content";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ sectionSlug: string; moduleSlug: string }>;
}) {
  const { sectionSlug, moduleSlug } = await params;
  const user = await getUser();
  const userId = user?.id;

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

  const isAdmin = user ? ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role) : false;

  // Check if employee is assigned to this module via a training path
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

    if (!assignedModuleIds.has(moduleData.id)) {
      redirect("/training");
    }
  }

  const module = {
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

  const sortedModules = (allSectionModules || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const currentIndex = sortedModules.findIndex((m: any) => m.id === module.id);
  const nextModule = currentIndex >= 0 && currentIndex < sortedModules.length - 1
    ? sortedModules[currentIndex + 1]
    : null;
  const isLastModule = currentIndex === sortedModules.length - 1;

  // Enforce sequential module order — check if previous module is completed
  if (userId && currentIndex > 0) {
    const prevModule = sortedModules[currentIndex - 1];
    const { data: prevCompletion } = await db
      .from("ModuleCompletion")
      .select("id")
      .eq("userId", userId)
      .eq("moduleId", prevModule.id)
      .limit(1);

    if (!prevCompletion || prevCompletion.length === 0) {
      redirect(`/training/${sectionSlug}`);
    }
  }

  let isCompleted = false;
  if (userId) {
    const { data: completionData } = await db
      .from("ModuleCompletion")
      .select("id")
      .eq("userId", userId)
      .eq("moduleId", module.id)
      .limit(1);
    isCompleted = (completionData || []).length > 0;
  }

  const videos = module.assets.filter((a: any) => a.fileType === "VIDEO");
  const documents = module.assets.filter((a: any) => ["PDF", "DOCUMENT", "CHECKLIST"].includes(a.fileType));
  const images = module.assets.filter((a: any) => a.fileType === "IMAGE");
  const printables = module.assets.filter((a: any) => a.isPrintable);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/training/${sectionSlug}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-ditch-orange font-medium">{module.section?.title}</p>
          <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
        </div>
        {isCompleted && (
          <Badge variant="completed" className="flex items-center gap-1 px-3 py-1">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </Badge>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3">
        {module.isRequired && <Badge variant="required">Required</Badge>}
        {module.estimatedMinutes && (
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" /> {formatDuration(module.estimatedMinutes)}
          </span>
        )}
        {module.tags.length > 0 && module.tags.map((tag: string) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      {/* Description */}
      {module.description && (
        <Card>
          <p className="text-gray-700 leading-relaxed">{module.description}</p>
        </Card>
      )}

      {/* Structured Content */}
      <ModuleContent moduleId={module.id} fallbackHtml={module.content} />

      {/* Videos */}
      {videos.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                <img
                  src={img.fileUrl}
                  alt={img.fileName}
                  className="w-full rounded-lg border border-gray-200"
                  loading="lazy"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                          <a href={doc.fileUrl} download className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
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
                        <a href={doc.fileUrl} download className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Download">
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
      {userId && !isCompleted && (
        <div className="flex justify-end">
          <MarkCompleteButton moduleId={module.id} skipReviewTimer={user?.skipReviewTimer} />
        </div>
      )}

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
                href={`/print/${doc.id}`}
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
        {nextModule ? (
          <Link
            href={`/training/${sectionSlug}/${nextModule.slug}`}
            className="inline-flex items-center gap-2 bg-ditch-navy text-white px-6 py-2.5 rounded-lg font-medium hover:bg-ditch-navy/90 transition-colors"
          >
            Next Module <ArrowRight className="w-4 h-4" />
          </Link>
        ) : isLastModule ? (
          <Link
            href={`/training/${sectionSlug}`}
            className="inline-flex items-center gap-2 bg-ditch-navy text-white px-6 py-2.5 rounded-lg font-medium hover:bg-ditch-navy/90 transition-colors"
          >
            Back to Section <ArrowRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
