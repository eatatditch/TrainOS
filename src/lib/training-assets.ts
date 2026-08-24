import { createAdminClient } from "@/lib/supabase/server";

export const TRAINING_ASSET_BUCKET = "training-assets";
// Media players and PDF viewers issue follow-up Range requests against the
// final signed URL. Keep the object private, but allow a full lesson session
// so playback does not fail midway through a longer module.
export const TRAINING_ASSET_URL_TTL_SECONDS = 60 * 60;

export interface TrainingAssetReference {
  storagePath?: unknown;
  fileUrl?: unknown;
}

function isSafeStoragePath(path: string) {
  return (
    path.length > 0 &&
    path.length <= 1_024 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.includes("\0") &&
    path.split("/").every((segment) => segment && segment !== "." && segment !== "..")
  );
}

/** Accept a canonical object path, rejecting traversal and malformed keys. */
export function normalizeTrainingAssetPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  return isSafeStoragePath(path) ? path : null;
}

/**
 * Resolve the canonical object path, including a compatibility fallback for
 * pre-migration public/signed Supabase URLs.
 */
export function resolveTrainingAssetPath(asset: TrainingAssetReference) {
  const canonicalPath = normalizeTrainingAssetPath(asset.storagePath);
  if (canonicalPath) return canonicalPath;
  if (typeof asset.fileUrl !== "string") return null;

  try {
    const target = new URL(asset.fileUrl);
    const projectOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
    if (target.origin !== projectOrigin) return null;

    const marker = `/${TRAINING_ASSET_BUCKET}/`;
    const markerIndex = target.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const encodedPath = target.pathname.slice(markerIndex + marker.length);
    const decodedPath = encodedPath
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
    return normalizeTrainingAssetPath(decodedPath);
  } catch {
    return null;
  }
}

export function trainingAssetAppUrl(assetId: string) {
  return `/api/assets/${encodeURIComponent(assetId)}`;
}

export function adminTrainingAssetAppUrl(path: string) {
  return `/api/admin/assets?path=${encodeURIComponent(path)}`;
}

export async function createTrainingAssetSignedUrl(
  path: string,
  downloadName?: string,
) {
  const safePath = normalizeTrainingAssetPath(path);
  if (!safePath) return { signedUrl: null, error: "Invalid asset path" };

  const supabaseAdmin = await createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from(TRAINING_ASSET_BUCKET)
    .createSignedUrl(
      safePath,
      TRAINING_ASSET_URL_TTL_SECONDS,
      downloadName ? { download: downloadName } : undefined,
    );

  return {
    signedUrl: data?.signedUrl ?? null,
    error: error?.message ?? null,
  };
}

export async function removeTrainingAssetObjects(
  assets: TrainingAssetReference[],
) {
  if (assets.some((asset) => !resolveTrainingAssetPath(asset))) {
    return { error: "One or more training assets has no valid storage path" };
  }

  const paths = Array.from(
    new Set(
      assets
        .map(resolveTrainingAssetPath)
        .filter((path): path is string => Boolean(path)),
    ),
  );
  if (paths.length === 0) return { error: null };

  const supabaseAdmin = await createAdminClient();
  const { error } = await supabaseAdmin.storage
    .from(TRAINING_ASSET_BUCKET)
    .remove(paths);
  if (error) {
    console.error("Training asset storage cleanup failed");
  }
  return { error: error?.message ?? null };
}
