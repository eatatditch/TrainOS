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
    const modules = await db.module.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: searchTerms } },
        ],
      },
      include: { section: true },
      take: 20,
    });

    for (const mod of modules) {
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
    const sections = await db.section.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    for (const sec of sections) {
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
    const quizzes = await db.quiz.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { module: { include: { section: true } } },
      take: 10,
    });

    for (const quiz of quizzes) {
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
    const indexed = await db.searchIndex.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: searchTerms } },
        ],
      },
      include: { module: { include: { section: true } }, section: true },
      take: 10,
    });

    for (const item of indexed) {
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
