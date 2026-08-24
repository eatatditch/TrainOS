import { db } from "@/lib/db";
import type { Position } from "@/lib/positions";

export type AssignPathsResult = {
  pathsAdded: number;
  modulesAdded: number;
};

export type AssignTrainingPathResult = AssignPathsResult & {
  alreadyAssigned: boolean;
};

export type SetUserPositionsResult = AssignPathsResult & {
  positions: Position[];
  primaryPosition: Position | null;
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
 * every active employee position and hire date while holding the employee lock. */
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

/** Replace an employee's active job set, mirror the primary position on User,
 * and reconcile all automatic paths in one database transaction. */
export async function setUserPositions(
  userId: string,
  positions: readonly Position[],
  assignedById: string | null,
): Promise<SetUserPositionsResult> {
  const { data, error } = await db.rpc("set_user_positions_atomic", {
    p_user_id: userId,
    p_positions: positions,
    p_assigned_by_id: assignedById,
  });
  if (error) throw new Error(error.message);

  const result = (data || {}) as Record<string, unknown>;
  const assignment =
    typeof result.assignment === "object" && result.assignment !== null
      ? (result.assignment as Record<string, unknown>)
      : {};
  return {
    positions: Array.isArray(result.positions)
      ? (result.positions as Position[])
      : [...positions],
    primaryPosition:
      typeof result.primaryPosition === "string"
        ? (result.primaryPosition as Position)
        : null,
    pathsAdded: asCount(assignment.pathsAdded),
    modulesAdded: asCount(assignment.modulesAdded),
  };
}
