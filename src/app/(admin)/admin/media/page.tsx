"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileUpload } from "@/components/admin/file-upload";
import { Image as ImageIcon, FileText, Video, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Asset {
  url: string;
  path: string;
  name?: string;
  asset?: any;
}

export default function MediaLibraryPage() {
  const [uploads, setUploads] = useState<Asset[]>([]);

  const handleUpload = (data: any) => {
    setUploads((prev) => [
      { url: data.url, path: data.path, name: data.asset?.fileName || data.path?.split("/").pop(), asset: data.asset },
      ...prev,
    ]);
  };

  const getIcon = (name: string) => {
    const ext = name?.split(".").pop()?.toLowerCase();
    if (["mp4", "mov", "avi", "webm"].includes(ext || "")) return Video;
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return ImageIcon;
    return FileText;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <p className="text-gray-500 mt-1">Upload and manage training assets</p>
      </div>

      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Upload Files</h2>
        <FileUpload onUploadComplete={handleUpload} />
        <p className="text-xs text-gray-400 mt-2">
          Tip: To attach files to a specific module, use the file upload in the module editor instead.
        </p>
      </Card>

      {uploads.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h2>
          <div className="space-y-2">
            {uploads.map((upload, i) => {
              const Icon = getIcon(upload.name || "");
              return (
                <Card key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{upload.name || "File"}</p>
                      <p className="text-xs text-gray-400 truncate max-w-md">{upload.url}</p>
                    </div>
                  </div>
                  <a
                    href={upload.url}
                    target="_blank"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {uploads.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title="No Recent Uploads"
          description="Upload files above or attach them directly to training modules via the content manager."
        />
      )}
    </div>
  );
}
