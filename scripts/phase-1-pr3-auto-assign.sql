-- Phase 1, PR 3 — Auto-assignment on hire / position change.
--
-- HOW TO RUN (no laptop required):
--   1. Open your Supabase project dashboard.
--   2. Left sidebar → SQL Editor → New query.
--   3. Paste this whole file in.
--   4. Click Run.
--
-- Idempotent: re-running is safe.
--
-- What this does:
--   * Adds TrainingPath.moduleIntervalDays (default 7) — the gap, in days,
--     between staggered due dates for modules in a path. Auto-assignment
--     uses this to space out a new hire's ModuleAssignments starting from
--     their hireDate.

ALTER TABLE "TrainingPath"
  ADD COLUMN IF NOT EXISTS "moduleIntervalDays" INT NOT NULL DEFAULT 7;
