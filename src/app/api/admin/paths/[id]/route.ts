import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isPosition } from "@/lib/positions";
import { ADMIN_ROLES, authorizeApi } from "@/lib/api-auth";

function sanitizePositions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter(isPosition)));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const moduleIds = Array.isArray(body.moduleIds)
    ? Array.from(
        new Set(
          body.moduleIds.filter(
            (moduleId: unknown): moduleId is string =>
              typeof moduleId === "string" && moduleId.length > 0,
          ),
        ),
      )
    : null;

  const { data, error } = await db.rpc("update_training_path_atomic", {
    p_training_path_id: id,
    p_title: title,
    p_description: typeof body.description === "string" ? body.description : "",
    p_is_active: typeof body.isActive === "boolean" ? body.isActive : true,
    p_target_role: typeof body.targetRole === "string" ? body.targetRole : "",
    p_target_positions: sanitizePositions(body.targetPositions),
    p_module_ids: moduleIds,
    p_assigned_by_id: auth.user.id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi(ADMIN_ROLES);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { data, error } = await db.rpc("archive_training_path_atomic", {
    p_training_path_id: id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, ...(data || {}) });
}
