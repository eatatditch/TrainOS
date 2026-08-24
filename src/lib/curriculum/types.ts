import type { Position } from "../positions";

/**
 * Versioned curriculum primitives.
 *
 * Curriculum is intentionally plain data. Pages can render these blocks without
 * embedding policy or menu copy in React components, and a seeder can publish the
 * same source into Supabase without creating a second version of Ditch.
 */

export type CurriculumRole =
  | "ALL_TEAM"
  | "TRAINER"
  | "LEADER"
  | "MANAGER";

export type CurriculumAudience = {
  roles: readonly CurriculumRole[];
  positions: readonly Position[];
  /** An unrestricted all-team program. Empty persisted target positions are
   * the database representation for this; module audiences may still list
   * every known position for clear display and validation. */
  global?: boolean;
};

export type SourceStatus = "approved" | "verification-required" | "rotating";

export type CurriculumSource = {
  id: string;
  title: string;
  version: string;
  effectiveDate?: string;
  status: SourceStatus;
  authority: string;
  notes?: string;
};

export type ContentBlock =
  | {
      type: "principle" | "standard" | "callout";
      title: string;
      body: string;
      tone?: "navy" | "orange" | "green" | "sand" | "warning";
    }
  | {
      type: "bullets" | "checklist" | "steps" | "outcomes";
      title: string;
      items: readonly string[];
    }
  | {
      type: "comparison";
      title: string;
      leftLabel: string;
      rightLabel: string;
      rows: readonly { left: string; right: string }[];
    }
  | {
      type: "script";
      title: string;
      setup?: string;
      lines: readonly string[];
    }
  | {
      type: "scenario" | "practice" | "field-assignment";
      title: string;
      prompt: string;
      successCriteria: readonly string[];
    }
  | {
      type: "menu-reference";
      title: string;
      itemIds: readonly string[];
      instruction: string;
    }
  | {
      type: "source-control";
      title: string;
      sourceIds: readonly string[];
      body: string;
      status: SourceStatus;
    };

export type AssessmentQuestion = {
  id: string;
  type: "multiple-choice" | "multi-select" | "true-false" | "short-answer" | "practical";
  prompt: string;
  options?: readonly string[];
  correctAnswer?: string | readonly string[] | boolean;
  explanation?: string;
  rubric?: readonly string[];
  critical?: boolean;
};

export type ModuleAssessment = {
  passingScore: number;
  retryLimit: number;
  questions: readonly AssessmentQuestion[];
  practicalRequired?: boolean;
  criticalMisses?: readonly string[];
};

export type CurriculumModule = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  audience: CurriculumAudience;
  estimatedMinutes: number;
  outcomes: readonly string[];
  prerequisites?: readonly string[];
  tags: readonly string[];
  sourceIds: readonly string[];
  content: readonly ContentBlock[];
  assessment: ModuleAssessment;
};

export type CurriculumProgram = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  audience: CurriculumAudience;
  version: string;
  effectiveDate: string;
  moduleIntervalDays: number;
  moduleIds: readonly string[];
  completionRule: "sequential" | "manager-assigned";
  certification?: {
    knowledgeScore: number;
    practicalRequired: boolean;
    liveObservationRequired: boolean;
    auditDays: readonly number[];
  };
};

export type MastermindSession = {
  day: number;
  slug: string;
  title: string;
  focus: string;
  openingQuestion: string;
  teachingPoint: string;
  example: string;
  drill: string;
  floorChallenge: string;
  managerObserves: readonly string[];
  closeQuestion: string;
};

export type MastermindCycle = {
  id: string;
  slug: string;
  title: string;
  behaviorFamily: string;
  standard: string;
  sessions: readonly MastermindSession[];
};

export type MenuSpecStatus = SourceStatus;
