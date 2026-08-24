import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

export async function GET() {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const { data } = await db.from("Ingredient").select("*").order("name");
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
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
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.from("Ingredient").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
