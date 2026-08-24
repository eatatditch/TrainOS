import { sanitizeTrainingHtml } from "@/lib/sanitize-html";

export function ModuleContent({
  fallbackHtml,
}: {
  fallbackHtml?: string;
}) {
  if (fallbackHtml) {
    const sanitizedHtml = sanitizeTrainingHtml(fallbackHtml);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    );
  }

  return null;
}
