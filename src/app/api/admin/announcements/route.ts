import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const { data: announcements } = await db
    .from("Announcement")
    .select("*, createdByUser:User!createdById(firstName, lastName)")
    .order("createdAt", { ascending: false });

  return NextResponse.json(announcements || []);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  const { data: announcement, error } = await db
    .from("Announcement")
    .insert({
      title: data.title,
      content: data.content,
      priority: data.priority || "NORMAL",
      isActive: true,
      createdById: user.id,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(announcement);
}
