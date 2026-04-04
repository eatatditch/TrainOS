import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  // Assign module to user
  if (data.moduleId && data.userId) {
    const { data: existing } = await db
      .from("ModuleAssignment")
      .select("*")
      .eq("userId", data.userId)
      .eq("moduleId", data.moduleId)
      .limit(1)
      .single();

    if (existing) return NextResponse.json({ message: "Already assigned" });

    const { data: assignment, error } = await db
      .from("ModuleAssignment")
      .insert({
        userId: data.userId,
        moduleId: data.moduleId,
        assignedById: user.id,
        isRequired: data.isRequired || false,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(assignment);
  }

  // Assign training path to user
  if (data.trainingPathId && data.userId) {
    const { data: path } = await db
      .from("TrainingPath")
      .select("*, modules:TrainingPathModule(*)")
      .eq("id", data.trainingPathId)
      .single();

    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    // Create path assignment
    await db.from("UserTrainingPath").insert({
      userId: data.userId,
      trainingPathId: data.trainingPathId,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    });

    // Assign all modules in path
    for (const pm of path.modules || []) {
      const { data: exists } = await db
        .from("ModuleAssignment")
        .select("*")
        .eq("userId", data.userId)
        .eq("moduleId", pm.moduleId)
        .limit(1)
        .single();

      if (!exists) {
        await db.from("ModuleAssignment").insert({
          userId: data.userId,
          moduleId: pm.moduleId,
          assignedById: user.id,
          isRequired: pm.isRequired,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
