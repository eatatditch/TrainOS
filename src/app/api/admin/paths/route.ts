import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPosition } from "@/lib/positions";

function sanitizePositions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter(isPosition)));
}

export async function GET() {
  const { data: paths } = await db
    .from("TrainingPath")
    .select("*, modules:TrainingPathModule(*, module:Module(*))")
    .order("createdAt", { ascending: false });

  // Sort modules by sortOrder and add assignment counts
  const pathsWithCounts = await Promise.all(
    (paths || []).map(async (p: any) => {
      if (p.modules) {
        p.modules.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      }
      const { count } = await db
        .from("UserTrainingPath")
        .select("*", { count: "exact", head: true })
        .eq("trainingPathId", p.id);
      return {
        ...p,
        _count: { assignments: count || 0 },
      };
    })
  );

  return NextResponse.json(pathsWithCounts);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  // Create the training path first
  const { data: path, error: pathError } = await db
    .from("TrainingPath")
    .insert({
      title: data.title,
      description: data.description || "",
      targetRole: data.targetRole || "",
      targetPositions: sanitizePositions(data.targetPositions),
      isActive: true,
    })
    .select()
    .single();

  if (pathError) return NextResponse.json({ error: pathError.message }, { status: 500 });

  // Create path modules separately
  if (data.moduleIds && data.moduleIds.length > 0) {
    const { data: modules } = await db
      .from("TrainingPathModule")
      .insert(
        data.moduleIds.map((moduleId: string, i: number) => ({
          trainingPathId: path.id,
          moduleId,
          sortOrder: i,
          isRequired: true,
        }))
      )
      .select();

    path.modules = modules || [];
  } else {
    path.modules = [];
  }

  return NextResponse.json(path);
}
