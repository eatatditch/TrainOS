import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — fetch training paths assigned to this employee
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const { data: assignments } = await db
    .from("UserTrainingPath")
    .select("*, trainingPath:TrainingPath(id, title, description, targetRole)")
    .eq("userId", id);

  return NextResponse.json(assignments || []);
}

// POST — assign a training path to this employee
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  if (!data.trainingPathId) {
    return NextResponse.json({ error: "trainingPathId required" }, { status: 400 });
  }

  // Check if already assigned
  const { data: existing } = await db
    .from("UserTrainingPath")
    .select("id")
    .eq("userId", id)
    .eq("trainingPathId", data.trainingPathId)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: "Already assigned" });
  }

  const { data: assignment, error } = await db
    .from("UserTrainingPath")
    .insert({
      userId: id,
      trainingPathId: data.trainingPathId,
      dueDate: data.dueDate || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(assignment);
}

// DELETE — remove a training path assignment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const trainingPathId = searchParams.get("trainingPathId");

  if (!trainingPathId) {
    return NextResponse.json({ error: "trainingPathId required" }, { status: 400 });
  }

  await db
    .from("UserTrainingPath")
    .delete()
    .eq("userId", id)
    .eq("trainingPathId", trainingPathId);

  return NextResponse.json({ success: true });
}
