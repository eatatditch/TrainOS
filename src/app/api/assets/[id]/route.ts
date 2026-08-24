import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  createTrainingAssetSignedUrl,
  resolveTrainingAssetPath,
} from "@/lib/training-assets";
import { canAccessModule, canManageTraining } from "@/lib/training-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { data: asset } = await db
    .from("ModuleAsset")
    .select(
      "id, moduleId, fileName, fileUrl, storagePath, module:Module(id, isActive)",
    )
    .eq("id", id)
    .single();

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const parentModule = asset.module as unknown as { isActive?: boolean } | null;
  if (
    (!canManageTraining(auth.user) && !parentModule?.isActive) ||
    !(await canAccessModule(auth.user, asset.moduleId))
  ) {
    return NextResponse.json(
      { error: "This asset is not part of your assigned training" },
      { status: 403 },
    );
  }

  const path = resolveTrainingAssetPath(asset);
  if (!path) {
    return NextResponse.json(
      { error: "Asset storage path is unavailable" },
      { status: 404 },
    );
  }

  const downloadName = request.nextUrl.searchParams.has("download")
    ? asset.fileName
    : undefined;
  const { signedUrl } = await createTrainingAssetSignedUrl(path, downloadName);
  if (!signedUrl) {
    return NextResponse.json(
      { error: "Unable to open this asset" },
      { status: 404 },
    );
  }

  const response = NextResponse.redirect(signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
