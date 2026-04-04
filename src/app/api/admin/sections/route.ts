import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { data: sections } = await db
    .from("Section")
    .select("*, modules:Module(*)")
    .order("sortOrder");

  // Sort modules within each section
  for (const section of sections || []) {
    if (section.modules) {
      section.modules.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
  }

  return NextResponse.json(sections || []);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();
  const slug = slugify(data.title);

  const { data: section, error } = await db
    .from("Section")
    .insert({
      title: data.title,
      description: data.description || "",
      slug,
      icon: data.icon || "",
      sortOrder: data.sortOrder || 0,
      isActive: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(section);
}
