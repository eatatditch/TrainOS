-- Phase 1, PR 2 — Position-based path targeting + assignment reason.
--
-- HOW TO RUN (no laptop required):
--   1. Open your Supabase project dashboard.
--   2. Left sidebar → SQL Editor → New query.
--   3. Paste this whole file in.
--   4. Click Run.
--
-- Idempotent: re-running is safe (IF NOT EXISTS guards on every statement).
--
-- What this does:
--   * Adds TrainingPath.targetPositions (text[]) so a path can target one or
--     more job positions (Server, Line Cook, …). Supersedes the legacy
--     single-value targetRole, which we keep for back-compat but stop
--     populating from new forms.
--   * Adds UserTrainingPath.assignedReason so we can distinguish
--     position-driven auto-assignments from manual manager overrides.
--   * Adds a GIN index for fast "paths targeting position X" lookups.

ALTER TABLE "TrainingPath"
  ADD COLUMN IF NOT EXISTS "targetPositions" TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "TrainingPath_targetPositions_idx"
  ON "TrainingPath" USING GIN ("targetPositions");

ALTER TABLE "UserTrainingPath"
  ADD COLUMN IF NOT EXISTS "assignedReason" TEXT NOT NULL DEFAULT 'manual';
