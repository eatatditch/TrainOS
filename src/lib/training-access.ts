import type { AppUser } from "./auth";
import { db } from "./db";

export function canManageTraining(user: AppUser) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role);
}

/** Resolve every module explicitly or path-assigned to an employee. */
export async function getAssignedModuleIds(userId: string): Promise<Set<string>> {
  const [{ data: directAssignments }, { data: pathAssignments }] =
    await Promise.all([
      db
        .from("ModuleAssignment")
        .select("moduleId")
        .eq("userId", userId)
        .eq("isActive", true),
      db
        .from("UserTrainingPath")
        .select("trainingPath:TrainingPath(isActive, modules:TrainingPathModule(moduleId))")
        .eq("userId", userId)
        .eq("isActive", true),
    ]);

  const moduleIds = new Set<string>();
  for (const assignment of directAssignments || []) {
    if (assignment.moduleId) moduleIds.add(assignment.moduleId);
  }
  for (const assignment of pathAssignments || []) {
    const path = assignment.trainingPath as unknown as {
      isActive?: boolean;
      modules?: Array<{ moduleId?: string }>;
    } | null;
    if (!path?.isActive) continue;
    for (const pathModule of path?.modules || []) {
      if (pathModule.moduleId) moduleIds.add(pathModule.moduleId);
    }
  }

  return moduleIds;
}

export async function canAccessModule(user: AppUser, moduleId: string) {
  if (canManageTraining(user)) return true;
  const moduleIds = await getAssignedModuleIds(user.id);
  return moduleIds.has(moduleId);
}

export async function getAccessibleSectionModuleIds(
  user: AppUser,
  sectionId: string,
): Promise<string[]> {
  let query = db
    .from("Module")
    .select("id")
    .eq("sectionId", sectionId)
    .eq("isActive", true);

  if (!canManageTraining(user)) {
    const assignedIds = Array.from(await getAssignedModuleIds(user.id));
    if (assignedIds.length === 0) return [];
    query = query.in("id", assignedIds);
  }

  const { data } = await query;
  return (data || []).map((module) => module.id);
}
