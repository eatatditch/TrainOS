import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_ROLES, authorizeApi } from "@/lib/api-auth";
import { removeTrainingAssetObjects } from "@/lib/training-assets";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const { data: asset } = await db
    .from("ModuleAsset")
    .select("id, fileUrl, storagePath")
    .eq("id", id)
    .single();
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const { error } = await db
    .from("ModuleAsset")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete the database reference first so a Storage outage can only leave an
  // inaccessible orphan, never a live asset row pointing at a missing object.
  const storageResult = await removeTrainingAssetObjects([asset]);
  return NextResponse.json({
    success: true,
    storageCleanupPending: Boolean(storageResult.error),
  });
}
