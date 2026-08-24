import { POSITIONS } from "../positions";
import type { CurriculumAudience } from "./types";

export const ALL_TEAM_AUDIENCE = {
  roles: ["ALL_TEAM"],
  positions: POSITIONS,
  global: true,
} as const satisfies CurriculumAudience;

export const FOH_AUDIENCE = {
  roles: ["ALL_TEAM"],
  positions: ["Server", "Bartender", "Support Staff", "Trainer"],
} as const satisfies CurriculumAudience;

export const SERVER_AUDIENCE = {
  roles: ["ALL_TEAM"],
  positions: ["Server"],
} as const satisfies CurriculumAudience;

export const BARTENDER_AUDIENCE = {
  roles: ["ALL_TEAM"],
  positions: ["Bartender"],
} as const satisfies CurriculumAudience;

export const SUPPORT_AUDIENCE = {
  roles: ["ALL_TEAM"],
  positions: ["Support Staff"],
} as const satisfies CurriculumAudience;

export const TRAINER_AUDIENCE = {
  roles: ["TRAINER"],
  // Trainer OS is a certification path, not a general FOH path. Employees
  // become eligible only after their position is explicitly set to Trainer.
  positions: ["Trainer"],
} as const satisfies CurriculumAudience;

export const LEADERSHIP_AUDIENCE = {
  roles: ["LEADER", "MANAGER"],
  positions: [
    "General Manager",
    "Assistant General Manager",
    "Bar Manager",
    "FOH Supervisor",
    "Kitchen Manager",
    "Assistant Kitchen Manager",
    "BOH Supervisor",
  ],
} as const satisfies CurriculumAudience;
