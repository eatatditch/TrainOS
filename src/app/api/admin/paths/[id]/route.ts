import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  const { data: path, error } = await db
    .from("TrainingPath")
    .update({
      title: data.title,
      description: data.description,
      targetRole: data.targetRole,
      isActive: data.isActive,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data.moduleIds) {
    await db.from("TrainingPathModule").delete().eq("trainingPathId", id);
    await db.from("TrainingPathModule").insert(
      data.moduleIds.map((moduleId: string, i: number) => ({
        trainingPathId: id,
        moduleId,
        sortOrder: i,
        isRequired: true,
      }))
    );
  }

  return NextResponse.json(path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.from("TrainingPath").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
