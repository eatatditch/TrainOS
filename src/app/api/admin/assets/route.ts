import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, authorizeApi } from "@/lib/api-auth";
import {
  createTrainingAssetSignedUrl,
  normalizeTrainingAssetPath,
} from "@/lib/training-assets";

/** Open an unattached media-library upload through a short-lived signed URL. */
export async function GET(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const path = normalizeTrainingAssetPath(
    request.nextUrl.searchParams.get("path"),
  );
  if (!path || !path.startsWith("uploads/")) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const downloadName = request.nextUrl.searchParams.has("download")
    ? path.split("/").at(-1)
    : undefined;
  const { signedUrl } = await createTrainingAssetSignedUrl(path, downloadName);
  if (!signedUrl) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const response = NextResponse.redirect(signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

