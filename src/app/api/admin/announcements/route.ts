import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

export async function GET() {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const { data: announcements } = await db
    .from("Announcement")
    .select("*, createdByUser:User!createdById(firstName, lastName)")
    .order("createdAt", { ascending: false });

  return NextResponse.json(announcements || []);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const data = await request.json();

  const { data: announcement, error } = await db
    .from("Announcement")
    .insert({
      title: data.title,
      content: data.content,
      priority: data.priority || "NORMAL",
      isActive: true,
      createdById: auth.user.id,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(announcement);
}
