"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";

interface FileUploadProps {
  moduleId?: string;
  onUploadComplete: (asset: any) => void;
  accept?: string;
  fileType?: string;
}

export function FileUpload({ moduleId, onUploadComplete, accept, fileType = "DOCUMENT" }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (moduleId) formData.append("moduleId", moduleId);
      formData.append("fileType", fileType);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUploadComplete(data);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
        dragOver ? "border-ditch-orange bg-ditch-orange/5" : "border-gray-300 hover:border-gray-400"
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-ditch-orange animate-spin" />
          <p className="text-sm text-gray-500">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            <span className="text-ditch-orange font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400">PDF, DOC, images, or video</p>
        </div>
      )}
    </div>
  );
}
