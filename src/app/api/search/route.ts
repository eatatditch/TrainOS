import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();
  const type = searchParams.get("type") || "all";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: any[] = [];

  // Search modules
  if (type === "all" || type === "module") {
    const { data: modules } = await db
      .from("Module")
      .select("*, section:Section(*)")
      .eq("isActive", true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(20);

    // Also search by tags separately
    const { data: tagModules } = await db
      .from("Module")
      .select("*, section:Section(*)")
      .eq("isActive", true)
      .overlaps("tags", searchTerms)
      .limit(20);

    const allModules = [...(modules || [])];
    const moduleIds = new Set(allModules.map((m: any) => m.id));
    for (const m of tagModules || []) {
      if (!moduleIds.has(m.id)) allModules.push(m);
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
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);

    for (const sec of sections || []) {
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
      .select("*, module:Module(*, section:Section(*))")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);

    for (const quiz of quizzes || []) {
      results.push({
        id: quiz.id,
        type: "quiz",
        title: quiz.title,
        description: quiz.description || "",
        sectionTitle: quiz.module?.section?.title || "",
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
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
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
