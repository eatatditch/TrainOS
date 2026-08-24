import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isPosition } from "@/lib/positions";
import { ADMIN_ROLES, MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

function sanitizePositions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter(isPosition)));
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  let pathQuery = db
    .from("TrainingPath")
    .select("*, modules:TrainingPathModule(*, module:Module(*))")
    .order("createdAt", { ascending: false });
  if (request.nextUrl.searchParams.get("includeInactive") !== "1") pathQuery = pathQuery.eq("isActive", true);
  const { data: paths, error } = await pathQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort modules by sortOrder and add assignment counts
  const pathsWithCounts = await Promise.all(
    (paths || []).map(async (p: any) => {
      const modules = (p.modules || [])
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .filter((link: any) => link.module)
        .map((link: any) => ({
          ...link.module,
          sortOrder: link.sortOrder ?? 0,
          isRequired: link.isRequired ?? true,
        }));
      const { count } = await db
        .from("UserTrainingPath")
        .select("*", { count: "exact", head: true })
        .eq("trainingPathId", p.id)
        .eq("isActive", true);
      return {
        ...p,
        modules,
        moduleIds: modules.map((module: any) => module.id),
        assignedCount: count || 0,
        _count: { assignments: count || 0 },
      };
    })
  );

  return NextResponse.json(pathsWithCounts);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const data = await request.json();
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const moduleIds: string[] = Array.isArray(data.moduleIds)
    ? Array.from(new Set(data.moduleIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)))
    : [];
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data: path, error } = await db.rpc("create_training_path_atomic", {
    p_title: title,
    p_description: typeof data.description === "string" ? data.description : "",
    p_target_role: typeof data.targetRole === "string" ? data.targetRole : "",
    p_target_positions: sanitizePositions(data.targetPositions),
    p_module_ids: moduleIds,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(path, { status: 201 });
}
