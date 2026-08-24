import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeApi } from "@/lib/api-auth";
import {
  canAccessModule,
  canManageTraining,
  getAssignedModuleIds,
} from "@/lib/training-access";
import { verifyReviewToken } from "@/lib/review-token";

export async function POST(request: NextRequest) {
  const auth = await authorizeApi();
  if (!auth.authorized) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const moduleId = body?.moduleId;
  const reviewToken = body?.reviewToken;
  if (
    typeof moduleId !== "string" ||
    !moduleId ||
    typeof reviewToken !== "string"
  ) {
    return NextResponse.json(
      { error: "A valid module review session is required" },
      { status: 400 },
    );
  }

  const { data: trainingModule, error: moduleError } = await db
    .from("Module")
    .select("id, sectionId, sortOrder, section:Section(isActive)")
    .eq("id", moduleId)
    .eq("isActive", true)
    .single();

  if (moduleError || !trainingModule) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  const parentSection = trainingModule.section as unknown as {
    isActive?: boolean;
  } | null;
  if (!parentSection?.isActive) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  if (!(await canAccessModule(user, trainingModule.id))) {
    return NextResponse.json(
      { error: "This module is not assigned to you" },
      { status: 403 },
    );
  }

  const review = verifyReviewToken(reviewToken, user.id, trainingModule.id);
  if (!review.valid) {
    return NextResponse.json(
      { error: "This review session expired. Reload the module and try again." },
      { status: 400 },
    );
  }
  if (!review.eligible) {
    return NextResponse.json(
      { error: "Finish the required review time before completing this module." },
      { status: 425 },
    );
  }

  // Enforce sequence on the server for employees. Only earlier modules that
  // are actually assigned to this employee are prerequisites.
  if (!canManageTraining(user)) {
    const assignedIds = Array.from(await getAssignedModuleIds(user.id));
    const { data: priorModules, error: priorModulesError } = await db
      .from("Module")
      .select("id")
      .eq("sectionId", trainingModule.sectionId)
      .eq("isActive", true)
      .lt("sortOrder", trainingModule.sortOrder ?? 0)
      .in("id", assignedIds);
    if (priorModulesError) {
      return NextResponse.json(
        { error: "Unable to verify module order" },
        { status: 503 },
      );
    }

    const priorIds = (priorModules || []).map((item) => item.id);
    if (priorIds.length > 0) {
      const { data: priorCompletions, error: priorCompletionsError } = await db
        .from("ModuleCompletion")
        .select("moduleId")
        .eq("userId", user.id)
        .in("moduleId", priorIds);
      if (priorCompletionsError) {
        return NextResponse.json(
          { error: "Unable to verify module prerequisites" },
          { status: 503 },
        );
      }
      const completedIds = new Set(
        (priorCompletions || []).map((item) => item.moduleId),
      );
      if (priorIds.some((id) => !completedIds.has(id))) {
        return NextResponse.json(
          { error: "Complete your earlier assigned modules first" },
          { status: 409 },
        );
      }
    }
  }

  const { data: existing } = await db
    .from("ModuleCompletion")
    .select("*")
    .eq("userId", user.id)
    .eq("moduleId", moduleId)
    .limit(1)
    .single();

  if (existing) return NextResponse.json({ message: "Already completed" });

  const { error: completionError } = await db
    .from("ModuleCompletion")
    .insert({ userId: user.id, moduleId });
  if (completionError) {
    return NextResponse.json(
      { error: "Unable to record module completion" },
      { status: 500 },
    );
  }

  // Update assignment status if exists
  await db
    .from("ModuleAssignment")
    .update({ status: "COMPLETED", completedAt: new Date().toISOString() })
    .eq("userId", user.id)
    .eq("moduleId", moduleId)
    .eq("isActive", true);

  return NextResponse.json({ success: true });
}
