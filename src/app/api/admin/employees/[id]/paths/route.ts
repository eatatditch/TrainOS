import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import { assignTrainingPathToUser, removeTrainingPathFromUser } from "@/lib/assignPaths";

// GET — fetch training paths assigned to this employee
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const { data: assignments } = await db
    .from("UserTrainingPath")
    .select("*, trainingPath:TrainingPath(id, title, description, targetRole, isActive)")
    .eq("userId", id)
    .eq("isActive", true);

  return NextResponse.json(
    (assignments || []).filter((assignment) => assignment.trainingPath?.isActive),
  );
}

// POST — assign a training path to this employee
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const data = await request.json();

  if (!data.trainingPathId) {
    return NextResponse.json({ error: "trainingPathId required" }, { status: 400 });
  }

  try {
    const result = await assignTrainingPathToUser(id, data.trainingPathId, auth.user.id, new Date(), data.dueDate || null);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Path assignment failed" }, { status: 500 });
  }
}

// DELETE — remove a training path assignment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const trainingPathId = searchParams.get("trainingPathId");

  if (!trainingPathId) {
    return NextResponse.json({ error: "trainingPathId required" }, { status: 400 });
  }

  try {
    await removeTrainingPathFromUser(id, trainingPathId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Path removal failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
