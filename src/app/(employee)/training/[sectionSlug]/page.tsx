import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDuration, calculatePercentage } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, FileText, Video, Image as ImageIcon } from "lucide-react";

export default async function SectionPage({ params }: { params: Promise<{ sectionSlug: string }> }) {
  const { sectionSlug } = await params;
  const user = await getUser();
  const userId = user?.id;

  const { data: sectionData } = await db
    .from("Section")
    .select("*, modules:Module(*, assets:ModuleAsset(*), quiz:Quiz(*))")
    .eq("slug", sectionSlug)
    .eq("isActive", true)
    .single();

  if (!sectionData) notFound();

  const section = {
    ...sectionData,
    modules: (sectionData.modules || [])
      .filter((m: any) => m.isActive)
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  };

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

      <div className="space-y-3">
        {section.modules.map((mod: any, index: number) => {
          const isCompleted = completedIds.has(mod.id);
          const hasVideo = (mod.assets || []).some((a: any) => a.fileType === "VIDEO");
          const hasPDF = (mod.assets || []).some((a: any) => a.fileType === "PDF" || a.fileType === "DOCUMENT" || a.fileType === "CHECKLIST");
          const hasImages = (mod.assets || []).some((a: any) => a.fileType === "IMAGE");

          return (
            <Link key={mod.id} href={`/training/${sectionSlug}/${mod.slug}`}>
              <Card hover className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-ditch-green text-white" : "bg-gray-100 text-gray-500"
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
                    {mod.quiz && (
                      <span className="text-xs text-ditch-orange flex items-center gap-1">Quiz</span>
                    )}
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
