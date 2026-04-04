import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const sectionId = request.nextUrl.searchParams.get("sectionId");

  let query = db
    .from("Module")
    .select("*, section:Section(*), quiz:Quiz(*), assets:ModuleAsset(*)")
    .order("sortOrder");

  if (sectionId) {
    query = query.eq("sectionId", sectionId);
  }

  const { data: modules } = await query;
  return NextResponse.json(modules || []);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();
  const slug = slugify(data.title);

  const { data: mod, error } = await db
    .from("Module")
    .insert({
      sectionId: data.sectionId,
      title: data.title,
      description: data.description || "",
      slug,
      content: data.content || "",
      estimatedMinutes: data.estimatedMinutes || null,
      isRequired: data.isRequired || false,
      isActive: true,
      sortOrder: data.sortOrder || 0,
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mod);
}
