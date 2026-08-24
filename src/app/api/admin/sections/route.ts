import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  let query = db
    .from("Section")
    .select("*, modules:Module(*)")
    .order("sortOrder");
  if (request.nextUrl.searchParams.get("includeInactive") !== "1") {
    query = query.eq("isActive", true);
  }
  const { data: sections } = await query;

  // Sort modules within each section
  for (const section of sections || []) {
    if (section.modules) {
      section.modules = section.modules
        .filter((trainingModule: any) => request.nextUrl.searchParams.get("includeInactive") === "1" || trainingModule.isActive)
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
  }

  return NextResponse.json(sections || []);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

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
