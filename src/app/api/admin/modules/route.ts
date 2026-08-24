import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const sectionId = request.nextUrl.searchParams.get("sectionId");

  let query = db
    .from("Module")
    .select("*, section:Section(*), quiz:Quiz!Quiz_moduleId_fkey(*), assets:ModuleAsset(*)")
    .order("sortOrder");

  if (sectionId) {
    query = query.eq("sectionId", sectionId);
  }
  if (request.nextUrl.searchParams.get("includeInactive") !== "1") {
    query = query.eq("isActive", true);
  }

  const { data: modules } = await query;
  return NextResponse.json(modules || []);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

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
