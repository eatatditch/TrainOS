import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeApi } from "@/lib/api-auth";
import { canManageTraining, getAssignedModuleIds } from "@/lib/training-access";
import { consumeApiRateLimit } from "@/lib/api-rate-limit";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi();
  if (!auth.authorized) return auth.response;
  if (!(await consumeApiRateLimit(`search:${auth.user.id}`, 90, 60))) {
    return NextResponse.json(
      { error: "Too many searches. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  const accessibleModuleIds = canManageTraining(auth.user)
    ? null
    : await getAssignedModuleIds(auth.user.id);
  const accessibleSectionIds = new Set<string>();
  if (accessibleModuleIds && accessibleModuleIds.size > 0) {
    const { data: accessibleModules } = await db
      .from("Module")
      .select("sectionId, isActive, section:Section(isActive)")
      .in("id", Array.from(accessibleModuleIds));
    for (const moduleRow of accessibleModules || []) {
      const parentSection = moduleRow.section as unknown as {
        isActive?: boolean;
      } | null;
      if (moduleRow.isActive && parentSection?.isActive && moduleRow.sectionId) {
        accessibleSectionIds.add(moduleRow.sectionId);
      }
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().slice(0, 150);
  const type = searchParams.get("type") || "all";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  // `.or()` accepts PostgREST filter syntax. Strip its control characters so
  // user text remains a value rather than becoming another filter clause.
  const filterQuery = query
    .replace(/[%_,().:'"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!filterQuery) return NextResponse.json({ results: [] });
  const results: any[] = [];

  // Search modules
  if (type === "all" || type === "module") {
    const { data: modules } = await db
      .from("Module")
      .select("*, section:Section(*)")
      .eq("isActive", true)
      .or(`title.ilike.%${filterQuery}%,description.ilike.%${filterQuery}%,content.ilike.%${filterQuery}%`)
      .limit(20);

    // Also search by tags separately
    const { data: tagModules } = await db
      .from("Module")
      .select("*, section:Section(*)")
      .eq("isActive", true)
      .overlaps("tags", searchTerms)
      .limit(20);

    const allModules = (modules || []).filter(
      (module) =>
        module.section?.isActive &&
        (accessibleModuleIds === null || accessibleModuleIds.has(module.id)),
    );
    const moduleIds = new Set(allModules.map((m: any) => m.id));
    for (const m of tagModules || []) {
      if (
        !moduleIds.has(m.id) &&
        m.section?.isActive &&
        (accessibleModuleIds === null || accessibleModuleIds.has(m.id))
      ) {
        allModules.push(m);
      }
    }

    for (const mod of allModules) {
      results.push({
        id: mod.id,
        type: "module",
        title: mod.title,
        description: mod.description || "",
        sectionTitle: mod.section?.title || "",
        sectionSlug: mod.section?.slug || "",
        moduleSlug: mod.slug,
        tags: mod.tags,
      });
    }
  }

  // Search sections
  if (type === "all" || type === "section") {
    const { data: sections } = await db
      .from("Section")
      .select("*")
      .eq("isActive", true)
      .or(`title.ilike.%${filterQuery}%,description.ilike.%${filterQuery}%`)
      .limit(10);

    for (const sec of sections || []) {
      if (
        accessibleModuleIds !== null &&
        !accessibleSectionIds.has(sec.id)
      ) {
        continue;
      }
      results.push({
        id: sec.id,
        type: "section",
        title: sec.title,
        description: sec.description || "",
        sectionTitle: "",
        sectionSlug: sec.slug,
        moduleSlug: "",
        tags: [],
      });
    }
  }

  // Search quizzes
  if (type === "all" || type === "quiz") {
    const { data: quizzes } = await db
      .from("Quiz")
      .select("*, module:Module!Quiz_moduleId_fkey(*, section:Section(*)), section:Section(*), coverage:QuizModuleCoverage(moduleId)")
      .eq("isActive", true)
      .or(`title.ilike.%${filterQuery}%,description.ilike.%${filterQuery}%`)
      .limit(10);

    for (const quiz of quizzes || []) {
      const hasActiveModuleParent = Boolean(
        quiz.moduleId && quiz.module?.isActive && quiz.module?.section?.isActive,
      );
      const hasActiveSectionParent = Boolean(
        !quiz.moduleId && quiz.sectionId && quiz.section?.isActive,
      );
      const hasPositionFinal = Boolean(
        quiz.quizType === "POSITION_FINAL" &&
        quiz.position &&
        (canManageTraining(auth.user) || auth.user.positions.includes(quiz.position)),
      );
      const hasManagedStandalone = Boolean(
        quiz.quizType === "STANDALONE" && canManageTraining(auth.user),
      );
      if (
        !hasActiveModuleParent &&
        !hasActiveSectionParent &&
        !hasPositionFinal &&
        !hasManagedStandalone
      ) continue;
      if (accessibleModuleIds !== null) {
        const moduleAllowed = quiz.moduleId
          ? accessibleModuleIds.has(quiz.moduleId)
          : false;
        const sectionAllowed = quiz.sectionId
          ? accessibleSectionIds.has(quiz.sectionId)
          : false;
        const finalAllowed = hasPositionFinal &&
          Array.isArray(quiz.coverage) &&
          quiz.coverage.length > 0 &&
          quiz.coverage.every((coverage: { moduleId?: string }) =>
            !!coverage.moduleId && accessibleModuleIds.has(coverage.moduleId),
          );
        if (!moduleAllowed && !sectionAllowed && !finalAllowed) continue;
      }
      results.push({
        id: quiz.id,
        type: "quiz",
        title: quiz.title,
        description: quiz.description || "",
        sectionTitle: quiz.module?.section?.title || quiz.section?.title || quiz.position || "",
        sectionSlug: quiz.module?.section?.slug || "",
        moduleSlug: quiz.module?.slug || "",
        tags: [],
      });
    }
  }

  // Search in SearchIndex table
  if (type === "all") {
    const { data: indexed } = await db
      .from("SearchIndex")
      .select("*, module:Module(*, section:Section(*)), section:Section(*)")
      .or(`title.ilike.%${filterQuery}%,content.ilike.%${filterQuery}%`)
      .limit(10);

    // Also search by tags in SearchIndex
    const { data: tagIndexed } = await db
      .from("SearchIndex")
      .select("*, module:Module(*, section:Section(*)), section:Section(*)")
      .overlaps("tags", searchTerms)
      .limit(10);

    const allIndexed = [...(indexed || [])];
    const indexedIds = new Set(allIndexed.map((i: any) => i.id));
    for (const item of tagIndexed || []) {
      if (!indexedIds.has(item.id)) allIndexed.push(item);
    }

    for (const item of allIndexed) {
      if (
        (item.moduleId &&
          (!item.module?.isActive || !item.module?.section?.isActive)) ||
        (item.sectionId && !item.section?.isActive)
      ) {
        continue;
      }
      if (accessibleModuleIds !== null) {
        if (item.moduleId && !accessibleModuleIds.has(item.moduleId)) continue;
        if (item.sectionId && !accessibleSectionIds.has(item.sectionId)) continue;
      }
      const existingIds = new Set(results.map((r) => r.id));
      const id = item.moduleId || item.sectionId;
      if (id && !existingIds.has(id)) {
        results.push({
          id,
          type: item.contentType === "section" ? "section" : "module",
          title: item.title,
          description: item.content?.substring(0, 200) || "",
          sectionTitle: item.section?.title || item.module?.section?.title || "",
          sectionSlug: item.section?.slug || item.module?.section?.slug || "",
          moduleSlug: item.module?.slug || "",
          tags: item.tags,
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    const key = `${r.type}-${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ results: unique.slice(0, 30) });
}
