import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: mod } = await db
    .from("Module")
    .select("*, section:Section(*), quiz:Quiz(*, questions:QuizQuestion(*)), assets:ModuleAsset(*)")
    .eq("id", id)
    .single();

  if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mod);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  // Handle asset deletion
  if (data.deleteAssetId) {
    await db.from("ModuleAsset").delete().eq("id", data.deleteAssetId).eq("moduleId", id);
    return NextResponse.json({ success: true, deleted: data.deleteAssetId });
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
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.from("Module").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
