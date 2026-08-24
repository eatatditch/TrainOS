import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";
import { assignTrainingPathToUser } from "@/lib/assignPaths";

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const { user } = auth;

  const data = await request.json();

  // Assign module to user
  if (data.moduleId && data.userId) {
    const { data: assignment, error } = await db
      .rpc("assign_training_module_direct_atomic", {
        p_user_id: data.userId,
        p_module_id: data.moduleId,
        p_assigned_by_id: user.id,
        p_is_required: data.isRequired === true,
        p_due_at: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(assignment);
  }

  // Assign training path to user
  if (data.trainingPathId && data.userId) {
    try {
      const result = await assignTrainingPathToUser(data.userId, data.trainingPathId, user.id, new Date(), data.dueDate || null);
      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Path assignment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
