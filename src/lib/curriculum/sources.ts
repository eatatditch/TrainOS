import type { CurriculumSource } from "./types";

/** Controlled references used by the curriculum. Current POS/manager-posted
 * updates always win when a menu, recipe, price, promotion, or policy changes. */
export const CURRICULUM_SOURCES = [
  {
    id: "hospitality-reset-2026-08",
    title: "The Ditch Hospitality Reset",
    version: "August 2026",
    effectiveDate: "2026-08-23",
    status: "approved",
    authority: "Ditch Leadership",
    notes: "Operating promise, guest standards, professionalism, ownership, and accountability.",
  },
  {
    id: "leadership-os-1",
    title: "The Hospitality Leadership Operating System",
    version: "1.0",
    effectiveDate: "2026-08-23",
    status: "approved",
    authority: "Ditch Leadership",
    notes: "Week 0-8 leadership curriculum and four Daily Mastermind cycles.",
  },
  {
    id: "trainer-os-1",
    title: "The Trainer Operating System",
    version: "1.0",
    effectiveDate: "2026-08-01",
    status: "approved",
    authority: "Ditch Leadership",
    notes: "Trainer selection, development, certification, role-manual architecture, and audit.",
  },
  {
    id: "bar-manual-2026-08",
    title: "Ditch Bar Manual",
    version: "Edition 01 / August 2026",
    effectiveDate: "2026-08-01",
    status: "approved",
    authority: "Ditch Leadership / Bar Program Owner",
    notes:
      "Controlled training copy. Recipe lock page, current POS buttons, and manager-posted updates supersede the printed edition.",
  },
  {
    id: "food-menu-supplied",
    title: "Ditch Dining Room Menu",
    version: "Current supplied print menu",
    status: "approved",
    authority: "Ditch Menu / Current POS",
    notes: "Guest-facing names, descriptions, and printed prices. Current POS controls availability and price.",
  },
  {
    id: "cocktail-menu-supplied",
    title: "Ditch Cocktail Menu",
    version: "Current supplied print menu",
    status: "approved",
    authority: "Ditch Menu / Current POS",
    notes: "Guest-facing names, descriptions, and printed prices. Recipe execution comes from the controlled bar manual.",
  },
  {
    id: "allergy-source-current",
    title: "Current Approved Allergy Procedure and Ingredient Source",
    version: "Live controlled source",
    status: "verification-required",
    authority: "Manager + Kitchen",
    notes:
      "Never infer an allergy answer from a menu description or curriculum card. Mark the allergy, communicate verbally, involve the manager, and let the kitchen verify what can be prepared safely.",
  },
  {
    id: "beer-source-current",
    title: "Current Beer List",
    version: "Live POS / current menu",
    status: "rotating",
    authority: "Current POS and manager-posted list",
    notes: "Selections rotate by location and date. Staff demonstrate how to verify the live list rather than memorize a stale fixed list.",
  },
] as const satisfies readonly CurriculumSource[];

export type CurriculumSourceId = (typeof CURRICULUM_SOURCES)[number]["id"];

export const CURRICULUM_SOURCE_BY_ID = new Map(
  CURRICULUM_SOURCES.map((source) => [source.id, source])
);

