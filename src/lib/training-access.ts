import type { AppUser } from "./auth";
import { db } from "./db";
import { isPosition, type Position } from "./positions";

export type QuizType =
  | "MODULE"
  | "SECTION"
  | "POSITION_FINAL"
  | "STANDALONE";

export function isQuizType(value: unknown): value is QuizType {
  return ["MODULE", "SECTION", "POSITION_FINAL", "STANDALONE"].includes(
    value as QuizType,
  );
}

export interface AssessmentScope {
  id: string;
  quizType: QuizType;
  moduleId: string | null;
  sectionId: string | null;
  position: Position | null;
  assessmentVersion: number;
  isActive: boolean;
}

export interface AssessmentReadiness {
  authorized: boolean;
  ready: boolean;
  prerequisiteModuleIds: string[];
  missingReviewModuleIds: string[];
  missingModuleQuizIds: string[];
  missingSectionQuizIds: string[];
  reason: string | null;
}

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

async function getCoverageModuleIds(quizId: string): Promise<string[]> {
  const { data, error } = await db
    .from("QuizModuleCoverage")
    .select("moduleId, sortOrder")
    .eq("quizId", quizId)
    .order("sortOrder", { ascending: true });
  if (error) throw new Error("Unable to load assessment coverage");
  return (data || []).map((row) => row.moduleId);
}

/** Resolve the exact module set represented by an assessment and verify that
 * an employee owns its scope. Generated section checks and position finals use
 * explicit coverage rows so their authorization cannot drift from the bank. */
export async function getAssessmentModuleIds(
  user: AppUser,
  quiz: AssessmentScope,
): Promise<string[] | null> {
  if (!quiz.isActive) return null;

  if (quiz.quizType === "MODULE") {
    if (!quiz.moduleId) return null;
    if (!canManageTraining(user) && !(await canAccessModule(user, quiz.moduleId))) {
      return null;
    }
    return [quiz.moduleId];
  }

  if (quiz.quizType === "SECTION") {
    if (!quiz.sectionId) return null;
    const coveredModuleIds = await getCoverageModuleIds(quiz.id);
    const moduleIds = coveredModuleIds.length > 0
      ? coveredModuleIds
      : await getAccessibleSectionModuleIds(user, quiz.sectionId);
    if (moduleIds.length === 0) return null;

    if (!canManageTraining(user)) {
      const assignedIds = await getAssignedModuleIds(user.id);
      if (moduleIds.some((moduleId) => !assignedIds.has(moduleId))) return null;
    }
    return moduleIds;
  }

  if (quiz.quizType === "POSITION_FINAL") {
    if (!quiz.position || !isPosition(quiz.position)) return null;
    if (!canManageTraining(user) && !user.positions.includes(quiz.position)) {
      return null;
    }

    const moduleIds = await getCoverageModuleIds(quiz.id);
    if (moduleIds.length === 0) return null;
    if (!canManageTraining(user)) {
      const assignedIds = await getAssignedModuleIds(user.id);
      if (moduleIds.some((moduleId) => !assignedIds.has(moduleId))) return null;
    }
    return moduleIds;
  }

  return canManageTraining(user) ? [] : null;
}

interface CurrentQuizRow {
  id: string;
  moduleId: string | null;
  assessmentVersion: number;
}

async function getPassedQuizIds(
  userId: string,
  quizzes: CurrentQuizRow[],
): Promise<Set<string>> {
  if (quizzes.length === 0) return new Set();

  const { data, error } = await db
    .from("QuizAttempt")
    .select("quizId, assessmentVersion, passed")
    .eq("userId", userId)
    .eq("passed", true)
    .in("quizId", quizzes.map((quiz) => quiz.id));
  if (error) throw new Error("Unable to verify current assessment attempts");

  const versionsByQuiz = new Map(
    quizzes.map((quiz) => [quiz.id, quiz.assessmentVersion]),
  );
  return new Set(
    (data || [])
      .filter(
        (attempt) =>
          versionsByQuiz.get(attempt.quizId) === attempt.assessmentVersion,
      )
      .map((attempt) => attempt.quizId),
  );
}

/** Return both access and mastery gates for a module check, section checkpoint,
 * or position final. Every gate is recomputed from current active assessment
 * versions, so archived one-question attempts never unlock the new curriculum. */
export async function getAssessmentReadiness(
  user: AppUser,
  quiz: AssessmentScope,
): Promise<AssessmentReadiness> {
  const prerequisiteModuleIds = await getAssessmentModuleIds(user, quiz);
  if (prerequisiteModuleIds === null) {
    return {
      authorized: false,
      ready: false,
      prerequisiteModuleIds: [],
      missingReviewModuleIds: [],
      missingModuleQuizIds: [],
      missingSectionQuizIds: [],
      reason: "This assessment is not part of your assigned training.",
    };
  }

  if (canManageTraining(user)) {
    return {
      authorized: true,
      ready: true,
      prerequisiteModuleIds,
      missingReviewModuleIds: [],
      missingModuleQuizIds: [],
      missingSectionQuizIds: [],
      reason: null,
    };
  }

  const { data: completions, error: completionsError } = prerequisiteModuleIds.length > 0
    ? await db
        .from("ModuleCompletion")
        .select("moduleId")
        .eq("userId", user.id)
        .in("moduleId", prerequisiteModuleIds)
    : { data: [], error: null };
  if (completionsError) throw new Error("Unable to verify training completion");

  const completedIds = new Set((completions || []).map((row) => row.moduleId));
  const missingReviewModuleIds = prerequisiteModuleIds.filter(
    (moduleId) => !completedIds.has(moduleId),
  );

  let missingModuleQuizIds: string[] = [];
  let missingSectionQuizIds: string[] = [];

  if (quiz.quizType === "SECTION" || quiz.quizType === "POSITION_FINAL") {
    const { data: moduleQuizzes, error: moduleQuizzesError } = await db
      .from("Quiz")
      .select("id, moduleId, assessmentVersion")
      .eq("quizType", "MODULE")
      .eq("isActive", true)
      .in("moduleId", prerequisiteModuleIds);
    if (moduleQuizzesError) throw new Error("Unable to load module checks");

    const currentModuleQuizzes = (moduleQuizzes || []) as CurrentQuizRow[];
    const passedModuleQuizIds = await getPassedQuizIds(
      user.id,
      currentModuleQuizzes,
    );
    missingModuleQuizIds = currentModuleQuizzes
      .filter((moduleQuiz) => !passedModuleQuizIds.has(moduleQuiz.id))
      .map((moduleQuiz) => moduleQuiz.id);
  }

  if (quiz.quizType === "POSITION_FINAL") {
    const { data: coverageRows, error: coverageError } = await db
      .from("QuizModuleCoverage")
      .select("quizId, moduleId, quiz:Quiz(id, quizType, isActive, assessmentVersion)");
    if (coverageError) throw new Error("Unable to load section checkpoints");

    const prerequisiteSet = new Set(prerequisiteModuleIds);
    const sectionsById = new Map<string, CurrentQuizRow & { covered: Set<string> }>();
    for (const coverageRow of coverageRows || []) {
      const coveredQuiz = coverageRow.quiz as unknown as {
        id?: string;
        quizType?: QuizType;
        isActive?: boolean;
        assessmentVersion?: number;
      } | null;
      if (
        !coveredQuiz?.id ||
        coveredQuiz.quizType !== "SECTION" ||
        !coveredQuiz.isActive ||
        typeof coveredQuiz.assessmentVersion !== "number"
      ) {
        continue;
      }
      const sectionQuiz = sectionsById.get(coveredQuiz.id) || {
        id: coveredQuiz.id,
        moduleId: null,
        assessmentVersion: coveredQuiz.assessmentVersion,
        covered: new Set<string>(),
      };
      sectionQuiz.covered.add(coverageRow.moduleId);
      sectionsById.set(coveredQuiz.id, sectionQuiz);
    }

    // Only require a checkpoint whose full module coverage belongs to this
    // final. A second position can therefore have a different final/checkpoint
    // set without cross-locking the employee.
    const currentSectionQuizzes = Array.from(sectionsById.values()).filter(
      (sectionQuiz) =>
        sectionQuiz.covered.size > 0 &&
        Array.from(sectionQuiz.covered).every((moduleId) => prerequisiteSet.has(moduleId)),
    );
    const passedSectionQuizIds = await getPassedQuizIds(
      user.id,
      currentSectionQuizzes,
    );
    missingSectionQuizIds = currentSectionQuizzes
      .filter((sectionQuiz) => !passedSectionQuizIds.has(sectionQuiz.id))
      .map((sectionQuiz) => sectionQuiz.id);
  }

  const ready =
    missingReviewModuleIds.length === 0 &&
    missingModuleQuizIds.length === 0 &&
    missingSectionQuizIds.length === 0;
  const reason = missingReviewModuleIds.length > 0
    ? "Complete every assigned lesson review before taking this assessment."
    : missingModuleQuizIds.length > 0
      ? "Pass every module knowledge check before taking this assessment."
      : missingSectionQuizIds.length > 0
        ? "Pass every section checkpoint before taking this position final."
        : null;

  return {
    authorized: true,
    ready,
    prerequisiteModuleIds,
    missingReviewModuleIds,
    missingModuleQuizIds,
    missingSectionQuizIds,
    reason,
  };
}
