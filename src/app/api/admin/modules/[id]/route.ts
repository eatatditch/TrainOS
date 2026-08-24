import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import { removeTrainingAssetObjects } from "@/lib/training-assets";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const { data: mod } = await db
    .from("Module")
    .select("*, section:Section(*), quiz:Quiz!Quiz_moduleId_fkey(*, questions:QuizQuestion(*)), assets:ModuleAsset(*)")
    .eq("id", id)
    .single();

  if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mod);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const data = await request.json();

  // Handle asset deletion
  if (data.deleteAssetId) {
    const { data: asset } = await db
      .from("ModuleAsset")
      .select("id, fileUrl, storagePath")
      .eq("id", data.deleteAssetId)
      .eq("moduleId", id)
      .single();
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const { error: deleteError } = await db
      .from("ModuleAsset")
      .delete()
      .eq("id", data.deleteAssetId)
      .eq("moduleId", id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    const storageResult = await removeTrainingAssetObjects([asset]);
    return NextResponse.json({
      success: true,
      deleted: data.deleteAssetId,
      storageCleanupPending: Boolean(storageResult.error),
    });
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.title) updateData.slug = slugify(data.title);
  if (data.content !== undefined) updateData.content = data.content;
  if (data.sectionId !== undefined) updateData.sectionId = data.sectionId;
  if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
  if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.tags !== undefined) updateData.tags = data.tags;

  const { data: mod, error } = await db
    .from("Module")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mod);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { error } = await db.rpc("archive_training_module_atomic", {
    p_module_id: id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    success: true,
    archived: true,
  });
}
