import { db } from "@/lib/db";
import { isPosition } from "@/lib/positions";

type TrainingPathRow = {
  id: string;
  moduleIntervalDays: number | null;
};

type TrainingPathModuleRow = {
  moduleId: string;
  sortOrder: number | null;
  isRequired: boolean | null;
};

export type AssignPathsResult = {
  pathsAdded: number;
  modulesAdded: number;
};

function toDate(input: Date | string | null | undefined): Date {
  if (input instanceof Date) return input;
  if (typeof input === "string" && input) {
    const parsed = new Date(input);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }
  return new Date();
}

function dayOffset(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/**
 * Create UserTrainingPath + ModuleAssignment rows for every active path
 * whose targetPositions include the user's position. Safe to re-run — it
 * skips paths the user is already on and modules they're already assigned.
 *
 * Existing path assignments are left alone when a user's position changes;
 * a manager handles cleanup of obsolete paths.
 */
export async function assignPathsForPosition(
  userId: string,
  position: string | null | undefined,
  hireDate: Date | string | null | undefined,
  assignedById: string | null = null,
): Promise<AssignPathsResult> {
  if (!position || !isPosition(position)) {
    return { pathsAdded: 0, modulesAdded: 0 };
  }

  const { data: paths } = await db
    .from("TrainingPath")
    .select("id, moduleIntervalDays")
    .eq("isActive", true)
    .contains("targetPositions", [position]);

  const matchingPaths = (paths as TrainingPathRow[] | null) ?? [];
  if (matchingPaths.length === 0) return { pathsAdded: 0, modulesAdded: 0 };

  const { data: existingLinks } = await db
    .from("UserTrainingPath")
    .select("trainingPathId")
    .eq("userId", userId);

  const alreadyOn = new Set(
    (existingLinks ?? []).map((r: { trainingPathId: string }) => r.trainingPathId),
  );

  const base = toDate(hireDate);
  let pathsAdded = 0;
  let modulesAdded = 0;

  for (const path of matchingPaths) {
    if (alreadyOn.has(path.id)) continue;

    const interval = path.moduleIntervalDays && path.moduleIntervalDays > 0
      ? path.moduleIntervalDays
      : 7;

    const { data: pathModules } = await db
      .from("TrainingPathModule")
      .select("moduleId, sortOrder, isRequired")
      .eq("trainingPathId", path.id)
      .order("sortOrder", { ascending: true });

    const modules = (pathModules as TrainingPathModuleRow[] | null) ?? [];
    const pathDueDate = modules.length > 0
      ? dayOffset(base, interval * modules.length)
      : null;

    const { error: linkError } = await db.from("UserTrainingPath").insert({
      userId,
      trainingPathId: path.id,
      dueDate: pathDueDate,
      assignedReason: "position",
    });
    if (linkError) continue;
    pathsAdded += 1;

    if (modules.length === 0) continue;

    const { data: existingAssignments } = await db
      .from("ModuleAssignment")
      .select("moduleId")
      .eq("userId", userId)
      .in("moduleId", modules.map((m) => m.moduleId));

    const alreadyAssigned = new Set(
      (existingAssignments ?? []).map((r: { moduleId: string }) => r.moduleId),
    );

    const newRows = modules
      .map((m, orderIndex) => ({ m, orderIndex }))
      .filter(({ m }) => !alreadyAssigned.has(m.moduleId))
      .map(({ m, orderIndex }) => ({
        userId,
        moduleId: m.moduleId,
        assignedById,
        isRequired: m.isRequired ?? true,
        dueDate: dayOffset(base, interval * (orderIndex + 1)),
      }));

    if (newRows.length > 0) {
      const { error: modError } = await db.from("ModuleAssignment").insert(newRows);
      if (!modError) modulesAdded += newRows.length;
    }
  }

  return { pathsAdded, modulesAdded };
}
