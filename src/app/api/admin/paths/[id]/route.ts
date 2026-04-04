import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  const path = await db.trainingPath.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      targetRole: data.targetRole,
      isActive: data.isActive,
    },
  });

  if (data.moduleIds) {
    await db.trainingPathModule.deleteMany({ where: { trainingPathId: id } });
    await db.trainingPathModule.createMany({
      data: data.moduleIds.map((moduleId: string, i: number) => ({
        trainingPathId: id,
        moduleId,
        sortOrder: i,
        isRequired: true,
      })),
    });
  }

  return NextResponse.json(path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.trainingPath.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
