import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

async function assertAdmin() {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) return false;
  return true;
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await db.from("Ingredient").select("*").order("name");
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, name, allergens, substitutes, notes } = await request.json();
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 });

  const { error } = await db.from("Ingredient").upsert({
    id,
    name,
    allergens: allergens || [],
    substitutes: substitutes || [],
    notes: notes || "",
    updatedAt: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.from("Ingredient").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
