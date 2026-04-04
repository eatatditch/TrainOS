import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await request.json();
  if (!moduleId) return NextResponse.json({ error: "Module ID required" }, { status: 400 });

  const { data: existing } = await db
    .from("ModuleCompletion")
    .select("*")
    .eq("userId", user.id)
    .eq("moduleId", moduleId)
    .limit(1)
    .single();

  if (existing) return NextResponse.json({ message: "Already completed" });

  await db.from("ModuleCompletion").insert({ userId: user.id, moduleId });

  // Update assignment status if exists
  await db
    .from("ModuleAssignment")
    .update({ status: "COMPLETED", completedAt: new Date().toISOString() })
    .eq("userId", user.id)
    .eq("moduleId", moduleId);

  return NextResponse.json({ success: true });
}
