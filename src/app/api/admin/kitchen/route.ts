import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

async function assertAdmin() {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await db.from("KitchenConfig").select("*").order("key");
  return NextResponse.json(data || []);
}

export async function PUT(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key, value, label, notes } = await request.json();
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

  const { error } = await db
    .from("KitchenConfig")
    .upsert({ key, value, label, notes, updatedAt: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = request.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });
  await db.from("KitchenConfig").delete().eq("key", key);
  return NextResponse.json({ ok: true });
}
