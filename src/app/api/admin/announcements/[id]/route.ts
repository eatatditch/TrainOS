import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_ROLES, authorizeApi } from "@/lib/api-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const data = await request.json();

  const { data: announcement, error } = await db
    .from("Announcement")
    .update({
      title: data.title,
      content: data.content,
      priority: data.priority,
      isActive: data.isActive,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(announcement);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  await db.from("Announcement").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
