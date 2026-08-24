/**
 * Employee job positions at Ditch — distinct from permission role (User.role).
 *
 * Permission role = what the app lets you DO (ADMIN can edit menus, EMPLOYEE cannot).
 * Position       = what you DO ON THE FLOOR (Server, Bartender, Line Cook, etc.).
 *
 * Positions drive: learning-path auto-assignment, role-scoped content, skills
 * sign-offs, floor scheduling gating.
 */

export const POSITIONS = [
  // FOH
  "Server",
  "Bartender",
  "Support Staff",
  "Trainer",
  // BOH
  "Line Cook",
  "Prep Cook",
  "Dishwasher",
  // Management
  "General Manager",
  "Assistant General Manager",
  "Bar Manager",
  "FOH Supervisor",
  "Kitchen Manager",
  "Assistant Kitchen Manager",
  "BOH Supervisor",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_DEPARTMENTS: Record<Position, "FOH" | "BOH" | "Management"> = {
  "Server": "FOH",
  "Bartender": "FOH",
  "Support Staff": "FOH",
  "Trainer": "FOH",
  "Line Cook": "BOH",
  "Prep Cook": "BOH",
  "Dishwasher": "BOH",
  "General Manager": "Management",
  "Assistant General Manager": "Management",
  "Bar Manager": "Management",
  "FOH Supervisor": "Management",
  "Kitchen Manager": "Management",
  "Assistant Kitchen Manager": "Management",
  "BOH Supervisor": "Management",
};

export const POSITION_NOTES: Partial<Record<Position, string>> = {
  "Support Staff": "Host, Busser, Barback, Food Runner",
};

export function isPosition(value: unknown): value is Position {
  return typeof value === "string" && (POSITIONS as readonly string[]).includes(value);
}

/** Normalize an API payload into a distinct, ordered list of controlled jobs.
 * The first entry is the employee's primary/display position. */
export function normalizePositions(value: unknown): Position[] {
  if (!Array.isArray(value)) return [];

  const positions: Position[] = [];
  for (const item of value) {
    if (isPosition(item) && !positions.includes(item)) positions.push(item);
  }
  return positions;
}
