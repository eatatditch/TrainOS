import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

export async function GET() {
  const auth = await authorizeApi();
  if (!auth.authorized) return auth.response;

  const { data } = await db
    .from("DietaryDefinition")
    .select("*")
    .order("sortOrder");
  return NextResponse.json(data || []);
}

async function assertAdmin() {
  return authorizeApi(MANAGER_ROLES);
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin();
  if (!auth.authorized) return auth.response;
  const { key, label, short_description, full_description, safe_for_celiac, icon, sortOrder } =
    await request.json();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const { error } = await db
    .from("DietaryDefinition")
    .upsert({
      key,
      label,
      short_description,
      full_description,
      safe_for_celiac,
      icon,
      sortOrder,
      updatedAt: new Date().toISOString(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await assertAdmin();
  if (!auth.authorized) return auth.response;
  const key = request.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  await db.from("DietaryDefinition").delete().eq("key", key);
  return NextResponse.json({ ok: true });
}
