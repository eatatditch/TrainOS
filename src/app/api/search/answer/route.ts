import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ answer: null, recipe: null, results: [] });
  }

  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  // Strip question words to find the actual drink/item name
  const drinkTerms = queryLower
    .replace(/how do (i|you) make (a |an |the )?/gi, "")
    .replace(/what('s| is| goes| comes) (in|on) (a |an |the )?/gi, "")
    .replace(/recipe (for )?(a |an |the )?/gi, "")
    .replace(/\b(recipe|spec|ingredients|what|how|make|whats|the|for|a|an)\b/gi, "")
    .replace(/[?!.,]/g, "")
    .trim();

  // Step 1: Search individual recipes in SearchIndex
  const { data: indexResults } = await db
    .from("SearchIndex")
    .select("*, module:Module(title, slug, section:Section(title, slug))")
    .eq("contentType", "recipe");

  const scoredRecipes = (indexResults || []).map((item: any) => {
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    const allTags = (item.tags || []).map((t: string) => t.toLowerCase());

    let score = 0;

    // Match cleaned drink name against title and tags
    if (drinkTerms && drinkTerms.length > 2) {
      if (titleLower.includes(drinkTerms)) score += 200;
      if (allTags.some((t: string) => t.includes(drinkTerms))) score += 150;
      // Also check partial matches for multi-word drink names
      const drinkWords = drinkTerms.split(/\s+/).filter((w) => w.length > 2);
      const matchCount = drinkWords.filter((w) =>
        titleLower.includes(w) || allTags.some((t: string) => t.includes(w))
      ).length;
      if (matchCount >= 2) score += 100;
      if (matchCount === drinkWords.length && drinkWords.length >= 2) score += 80;
    }

    // Direct term matches
    for (const term of searchTerms) {
      if (allTags.includes(term)) score += 40;
      if (titleLower.includes(term)) score += 30;
    }

    return { ...item, score };
  })
  .filter((item: any) => item.score > 0)
  .sort((a: any, b: any) => b.score - a.score);

  // If we found a recipe match, parse it into structured format
  if (scoredRecipes.length > 0 && scoredRecipes[0].score >= 50) {
    const top = scoredRecipes[0];
    const recipe = parseRecipe(top.title, top.content);

    return NextResponse.json({
      answer: null,
      recipe: {
        ...recipe,
        source: {
          title: top.module?.title || "",
          section: top.module?.section?.title || "",
          sectionSlug: top.module?.section?.slug || "",
          moduleSlug: top.module?.slug || "",
        },
      },
      results: [], // No other results when we have a recipe match
    });
  }

  // Step 2: Fall back to module content search for non-recipe questions
  const { data: modules } = await db
    .from("Module")
    .select("id, title, slug, description, content, tags, section:Section(title, slug)")
    .eq("isActive", true);

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

  const scoredModules = (modules || []).map((mod: any) => {
    const plainContent = stripHtml(mod.content || "");
    const allText = `${mod.title} ${mod.description || ""} ${plainContent} ${(mod.tags || []).join(" ")}`.toLowerCase();

    let score = 0;
    if (allText.includes(queryLower)) score += 50;
    for (const term of searchTerms) {
      if (mod.title?.toLowerCase().includes(term)) score += 15;
      if (mod.description?.toLowerCase().includes(term)) score += 10;
      if (plainContent.toLowerCase().includes(term)) score += 5;
      if ((mod.tags || []).some((t: string) => t.toLowerCase().includes(term))) score += 8;
    }

    let snippet = "";
    if (score > 0 && plainContent) {
      for (const term of searchTerms) {
        const idx = plainContent.toLowerCase().indexOf(term);
        if (idx !== -1) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(plainContent.length, idx + 200);
          snippet = (start > 0 ? "..." : "") + plainContent.substring(start, end).trim() + (end < plainContent.length ? "..." : "");
          break;
        }
      }
    }

    return {
      id: mod.id, type: "module" as const, title: mod.title,
      description: snippet || mod.description,
      sectionTitle: mod.section?.title || "", sectionSlug: mod.section?.slug || "",
      moduleSlug: mod.slug, tags: mod.tags || [], score,
    };
  })
  .filter((m: any) => m.score > 0)
  .sort((a: any, b: any) => b.score - a.score);

  let answer = null;
  if (scoredModules.length > 0 && scoredModules[0].score >= 10) {
    const top = scoredModules[0];
    answer = {
      text: top.description,
      source: { title: top.title, section: top.sectionTitle, sectionSlug: top.sectionSlug, moduleSlug: top.moduleSlug },
      confidence: top.score >= 50 ? "high" : top.score >= 20 ? "medium" : "low",
    };
  }

  return NextResponse.json({
    answer,
    recipe: null,
    results: scoredModules.slice(0, 10),
  });
}

function parseRecipe(title: string, content: string): any {
  // Parse the structured recipe text into fields
  const name = title.replace(/ Recipe$/, "");

  const glassMatch = content.match(/Glass:\s*([^\n|]+)/i);
  const procedureMatch = content.match(/Procedure:\s*([^\n]+)/i);
  const garnishMatch = content.match(/Garnish:\s*([^\n]+)/i);
  const noteMatch = content.match(/Note:\s*([^\n]+)/i);
  const yieldMatch = content.match(/Yield:\s*([^\n|]+)/i);
  const shelfMatch = content.match(/Shelf Life:\s*([^\n|]+)/i);
  const priceMatch = content.match(/\((\$\d+)\)/);

  // Extract ingredients
  const ingredientsMatch = content.match(/Ingredients:\s*([^\n]*(?:\n(?!Garnish:|Note:|⚠)[^\n]*)*)/i);
  let ingredients: string[] = [];
  if (ingredientsMatch) {
    ingredients = ingredientsMatch[1]
      .split(/,\s*/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
  }

  // Check for allergy warnings
  const hasNutWarning = content.includes("CONTAINS NUTS") || content.includes("NUT ALLERGY");

  return {
    name,
    glass: glassMatch ? glassMatch[1].trim() : "",
    procedure: procedureMatch ? procedureMatch[1].trim() : "",
    ingredients,
    garnish: garnishMatch ? garnishMatch[1].trim() : "",
    note: noteMatch ? noteMatch[1].trim() : "",
    price: priceMatch ? priceMatch[1] : "",
    yield: yieldMatch ? yieldMatch[1].trim() : "",
    shelfLife: shelfMatch ? shelfMatch[1].trim() : "",
    allergyWarning: hasNutWarning ? "⚠️ CONTAINS NUTS" : "",
  };
}
