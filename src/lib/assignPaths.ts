import { db } from "@/lib/db";

export type AssignPathsResult = {
  pathsAdded: number;
  modulesAdded: number;
};

export type AssignTrainingPathResult = AssignPathsResult & {
  alreadyAssigned: boolean;
};

function timestamp(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
  }
  return null;
}

function asCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Assign a path and its module provenance in one locked database transaction. */
export async function assignTrainingPathToUser(
  userId: string,
  trainingPathId: string,
  assignedById: string | null,
  startDate: Date | string | null | undefined = new Date(),
  requestedPathDueDate: Date | string | null | undefined = null,
): Promise<AssignTrainingPathResult> {
  const { data, error } = await db.rpc("assign_training_path_atomic", {
    p_user_id: userId,
    p_training_path_id: trainingPathId,
    p_assigned_by_id: assignedById,
    p_start_at: timestamp(startDate) || new Date().toISOString(),
    p_requested_due_at: timestamp(requestedPathDueDate),
    p_reason: "manual",
  });
  if (error) throw new Error(error.message);
  const result = (data || {}) as Record<string, unknown>;
  return {
    pathsAdded: asCount(result.pathsAdded),
    modulesAdded: asCount(result.modulesAdded),
    alreadyAssigned: result.alreadyAssigned === true,
  };
}

/** Remove a path source and only delete assignments that have no source left. */
export async function removeTrainingPathFromUser(
  userId: string,
  trainingPathId: string,
) {
  const { error } = await db.rpc("remove_training_path_atomic", {
    p_user_id: userId,
    p_training_path_id: trainingPathId,
  });
  if (error) throw new Error(error.message);
}

/** Reconcile every assignee after an administrator changes path membership. */
export async function reconcileTrainingPathAssignments(
  trainingPathId: string,
  assignedById: string | null,
) {
  const { error } = await db.rpc("reconcile_training_path_atomic", {
    p_training_path_id: trainingPathId,
    p_assigned_by_id: assignedById,
  });
  if (error) throw new Error(error.message);
}

/** Assign all all-team and position-matched paths atomically. The database reads
 * the employee's current position/hire date while holding the employee lock. */
export async function assignPathsForPosition(
  userId: string,
  _position: string | null | undefined,
  _hireDate: Date | string | null | undefined,
  assignedById: string | null = null,
): Promise<AssignPathsResult> {
  const { data, error } = await db.rpc("assign_paths_for_position_atomic", {
    p_user_id: userId,
    p_assigned_by_id: assignedById,
  });
  if (error) throw new Error(error.message);
  const result = (data || {}) as Record<string, unknown>;
  return {
    pathsAdded: asCount(result.pathsAdded),
    modulesAdded: asCount(result.modulesAdded),
  };
}
