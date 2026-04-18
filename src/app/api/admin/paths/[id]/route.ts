import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPosition } from "@/lib/positions";

function sanitizePositions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter(isPosition)));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  const update: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    isActive: data.isActive,
    targetPositions: sanitizePositions(data.targetPositions),
  };
  if (typeof data.targetRole === "string") update.targetRole = data.targetRole;

  const { data: path, error } = await db
    .from("TrainingPath")
    .update(update)
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
