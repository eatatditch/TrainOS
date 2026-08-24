export * from "./types";
export * from "./sources";
export * from "./menu";
export * from "./hospitality-reset";
export * from "./leadership";
export * from "./masterminds";
export * from "./trainer-os";
export * from "./onboarding";
export * from "./render";

import { HOSPITALITY_RESET_MODULES, HOSPITALITY_RESET_PROGRAM } from "./hospitality-reset";
import { LEADERSHIP_MODULES, LEADERSHIP_PROGRAM } from "./leadership";
import { MASTERMIND_CYCLES, MASTERMIND_MODULES, MASTERMIND_PROGRAM } from "./masterminds";
import { COCKTAIL_MENU, FOOD_MENU_ITEMS } from "./menu";
import {
  BARTENDER_ONBOARDING_MODULES,
  BARTENDER_ONBOARDING_PROGRAM,
  SERVER_ONBOARDING_MODULES,
  SERVER_ONBOARDING_PROGRAM,
  SUPPORT_ONBOARDING_MODULES,
  SUPPORT_ONBOARDING_PROGRAM,
} from "./onboarding";
import { CURRICULUM_SOURCES } from "./sources";
import { TRAINER_OS_MODULES, TRAINER_OS_PROGRAM } from "./trainer-os";
import type { CurriculumModule, CurriculumProgram } from "./types";

/** Single registry consumed by renderers, seed generation, search indexing, and QA. */
export const CURRICULUM_MODULES: readonly CurriculumModule[] = [
  ...HOSPITALITY_RESET_MODULES,
  ...LEADERSHIP_MODULES,
  ...MASTERMIND_MODULES,
  ...TRAINER_OS_MODULES,
  ...SERVER_ONBOARDING_MODULES,
  ...BARTENDER_ONBOARDING_MODULES,
  ...SUPPORT_ONBOARDING_MODULES,
];

export const CURRICULUM_PROGRAMS = [
  HOSPITALITY_RESET_PROGRAM,
  LEADERSHIP_PROGRAM,
  MASTERMIND_PROGRAM,
  TRAINER_OS_PROGRAM,
  SERVER_ONBOARDING_PROGRAM,
  BARTENDER_ONBOARDING_PROGRAM,
  SUPPORT_ONBOARDING_PROGRAM,
] as const satisfies readonly CurriculumProgram[];

export const MENU_ITEMS = [...FOOD_MENU_ITEMS, ...COCKTAIL_MENU] as const;

export const CURRICULUM_MODULE_BY_ID = new Map(
  CURRICULUM_MODULES.map((curriculumModule) => [curriculumModule.id, curriculumModule])
);

export const CURRICULUM_MODULE_BY_SLUG = new Map(
  CURRICULUM_MODULES.map((curriculumModule) => [curriculumModule.slug, curriculumModule])
);

export const CURRICULUM_PROGRAM_BY_ID = new Map(
  CURRICULUM_PROGRAMS.map((program) => [program.id, program])
);

export const MENU_ITEM_BY_ID = new Map(MENU_ITEMS.map((item) => [item.id, item]));

export type CurriculumValidationIssue = {
  code: string;
  message: string;
};

/** Cheap deterministic QA suitable for a build check or seed command. */
export function validateCurriculum(): CurriculumValidationIssue[] {
  const issues: CurriculumValidationIssue[] = [];
  const sourceIds: Set<string> = new Set(CURRICULUM_SOURCES.map((source) => source.id));
  const moduleIds = new Set<string>();
  const moduleSlugs = new Set<string>();
  const questionIds = new Set<string>();
  const menuItemIds = new Set<string>();

  for (const item of MENU_ITEMS) {
    if (menuItemIds.has(item.id)) {
      issues.push({ code: "duplicate-menu-id", message: `Duplicate menu item id: ${item.id}` });
    }
    menuItemIds.add(item.id);
  }

  for (const item of FOOD_MENU_ITEMS) {
    if (item.allergyStatus !== "verification-required") {
      issues.push({ code: "unsafe-food-allergy-status", message: `${item.id} must require allergy verification` });
    }
  }

  const requiredRecipeLocks = new Set([
    "drink-ancho-average",
    "drink-sunburnt-summer",
    "drink-frozen-paloma",
    "drink-da-painkiller",
    "drink-island-rum-punch",
    "drink-hibiscus-refresher",
  ]);
  for (const item of COCKTAIL_MENU) {
    const hasMeasuredBuild = "build" in item && Array.isArray(item.build) && item.build.length > 0;
    if (requiredRecipeLocks.has(item.id) && item.status !== "verification-required") {
      issues.push({ code: "missing-recipe-lock", message: `${item.id} must remain verification-required` });
    }
    if (item.status === "verification-required" && hasMeasuredBuild) {
      issues.push({ code: "locked-recipe-has-build", message: `${item.id} must not publish a measured build` });
    }
    if (item.status === "approved" && (!hasMeasuredBuild || !item.glass || !item.method)) {
      issues.push({ code: "incomplete-approved-recipe", message: `${item.id} lacks a controlled build, glass, or method` });
    }
  }

  for (const curriculumModule of CURRICULUM_MODULES) {
    if (moduleIds.has(curriculumModule.id)) {
      issues.push({ code: "duplicate-module-id", message: `Duplicate module id: ${curriculumModule.id}` });
    }
    moduleIds.add(curriculumModule.id);

    if (moduleSlugs.has(curriculumModule.slug)) {
      issues.push({ code: "duplicate-module-slug", message: `Duplicate module slug: ${curriculumModule.slug}` });
    }
    moduleSlugs.add(curriculumModule.slug);

    if (curriculumModule.outcomes.length === 0 || curriculumModule.content.length === 0 || curriculumModule.assessment.questions.length === 0) {
      issues.push({ code: "incomplete-module", message: `Module lacks outcomes, content, or assessment: ${curriculumModule.id}` });
    }

    for (const sourceId of curriculumModule.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        issues.push({ code: "unknown-source", message: `${curriculumModule.id} references unknown source ${sourceId}` });
      }
    }

    for (const question of curriculumModule.assessment.questions) {
      if (questionIds.has(question.id)) {
        issues.push({ code: "duplicate-question-id", message: `Duplicate question id: ${question.id}` });
      }
      questionIds.add(question.id);
    }

    for (const block of curriculumModule.content) {
      if (block.type !== "menu-reference") continue;
      for (const itemId of block.itemIds) {
        if (!MENU_ITEM_BY_ID.has(itemId)) {
          issues.push({ code: "unknown-menu-item", message: `${curriculumModule.id} references unknown menu item ${itemId}` });
        }
      }
    }
  }

  for (const curriculumModule of CURRICULUM_MODULES) {
    for (const prerequisite of curriculumModule.prerequisites ?? []) {
      if (!moduleIds.has(prerequisite)) {
        issues.push({ code: "unknown-prerequisite", message: `${curriculumModule.id} references unknown prerequisite ${prerequisite}` });
      }
    }
  }

  const moduleOwnerIds = new Set<string>();
  for (const program of CURRICULUM_PROGRAMS) {
    for (const moduleId of program.moduleIds) {
      if (!moduleIds.has(moduleId)) {
        issues.push({ code: "unknown-program-module", message: `${program.id} references unknown module ${moduleId}` });
      }
      if (moduleOwnerIds.has(moduleId)) {
        issues.push({ code: "duplicate-program-module", message: `${moduleId} belongs to more than one program` });
      }
      moduleOwnerIds.add(moduleId);
    }
  }

  for (const moduleId of moduleIds) {
    if (!moduleOwnerIds.has(moduleId)) {
      issues.push({ code: "orphan-module", message: `${moduleId} does not belong to a program` });
    }
  }

  for (const cycle of MASTERMIND_CYCLES) {
    if (cycle.sessions.length !== 10) {
      issues.push({ code: "mastermind-cycle-size", message: `${cycle.id} must contain exactly 10 sessions` });
    }
    const days = cycle.sessions.map((session) => session.day);
    if (new Set(days).size !== 10 || Math.min(...days) !== 1 || Math.max(...days) !== 10) {
      issues.push({ code: "mastermind-day-sequence", message: `${cycle.id} must use days 1 through 10 exactly once` });
    }
  }

  return issues;
}
