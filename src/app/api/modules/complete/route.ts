import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await request.json();
  if (!moduleId) return NextResponse.json({ error: "Module ID required" }, { status: 400 });

  const existing = await db.moduleCompletion.findFirst({
    where: { userId: session.user.id, moduleId },
  });

  if (existing) return NextResponse.json({ message: "Already completed" });

  await db.moduleCompletion.create({
    data: { userId: session.user.id, moduleId },
  });

  // Update assignment status if exists
  await db.moduleAssignment.updateMany({
    where: { userId: session.user.id, moduleId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
