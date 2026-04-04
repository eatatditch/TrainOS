import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  // Assign module to user
  if (data.moduleId && data.userId) {
    const existing = await db.moduleAssignment.findFirst({
      where: { userId: data.userId, moduleId: data.moduleId },
    });
    if (existing) return NextResponse.json({ message: "Already assigned" });

    const assignment = await db.moduleAssignment.create({
      data: {
        userId: data.userId,
        moduleId: data.moduleId,
        assignedById: session.user.id,
        isRequired: data.isRequired || false,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
    return NextResponse.json(assignment);
  }

  // Assign training path to user
  if (data.trainingPathId && data.userId) {
    const path = await db.trainingPath.findUnique({
      where: { id: data.trainingPathId },
      include: { modules: true },
    });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    // Create path assignment
    await db.userTrainingPath.create({
      data: {
        userId: data.userId,
        trainingPathId: data.trainingPathId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    // Assign all modules in path
    for (const pm of path.modules) {
      const exists = await db.moduleAssignment.findFirst({
        where: { userId: data.userId, moduleId: pm.moduleId },
      });
      if (!exists) {
        await db.moduleAssignment.create({
          data: {
            userId: data.userId,
            moduleId: pm.moduleId,
            assignedById: session.user.id,
            isRequired: pm.isRequired,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
