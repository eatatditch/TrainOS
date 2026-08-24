import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, authorizeApi } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  adminTrainingAssetAppUrl,
  TRAINING_ASSET_BUCKET,
  trainingAssetAppUrl,
} from "@/lib/training-assets";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);
const ALLOWED_ASSET_TYPES = new Set([
  "CHECKLIST",
  "DOCUMENT",
  "IMAGE",
  "PDF",
  "VIDEO",
]);

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const formData = await request.formData();
  const fileValue = formData.get("file");
  const file = fileValue instanceof File ? fileValue : null;
  const moduleIdValue = formData.get("moduleId");
  const moduleId =
    typeof moduleIdValue === "string" && moduleIdValue.trim()
      ? moduleIdValue.trim()
      : null;
  const fileTypeValue = formData.get("fileType");
  const fileType =
    typeof fileTypeValue === "string" && ALLOWED_ASSET_TYPES.has(fileTypeValue)
      ? fileTypeValue
      : "DOCUMENT";
  const isPrintable = formData.get("isPrintable") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (moduleId && !/^[a-zA-Z0-9_-]{1,128}$/.test(moduleId)) {
    return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Files must be between 1 byte and 25 MB" },
      { status: 400 },
    );
  }
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  // Use service role client for storage
  const supabase = await createAdminClient();

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = moduleId ? `modules/${moduleId}/${fileName}` : `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(TRAINING_ASSET_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // If moduleId provided, create ModuleAsset record
  if (moduleId) {
    const assetId = crypto.randomUUID();
    const appUrl = trainingAssetAppUrl(assetId);
    const { data: asset, error: assetError } = await supabase
      .from("ModuleAsset")
      .insert({
        id: assetId,
        moduleId,
        fileName: file.name,
        fileUrl: appUrl,
        storagePath: path,
        fileType: fileType,
        fileSize: file.size,
        isPrintable,
        sortOrder: 0,
      })
      .select()
      .single();

    if (assetError) {
      await supabase.storage.from(TRAINING_ASSET_BUCKET).remove([path]);
      return NextResponse.json({ error: assetError.message }, { status: 500 });
    }

    return NextResponse.json({ asset, url: appUrl, path });
  }

  return NextResponse.json({ url: adminTrainingAssetAppUrl(path), path });
}
