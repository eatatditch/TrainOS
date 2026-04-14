import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { askLLM, shouldUseLLM } from "@/lib/llm";

const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  gluten: /\b(gluten|wheat|celiac)\b/i,
  dairy: /\b(dairy|milk|lactose|cheese)\b/i,
  egg: /\b(egg|eggs)\b/i,
  fish: /\bfish\b/i,
  shellfish: /\b(shellfish|shrimp|lobster|crab|prawn)\b/i,
  soy: /\bsoy\b/i,
  nut: /\b(nuts?|peanut|peanuts|tree\s*nut)\b/i,
  sesame: /\bsesame\b/i,
};

const DIETARY_PATTERNS: Record<string, RegExp> = {
  vegan: /\bvegan\b/i,
  vegetarian: /\b(vegetarian|veggie)\b/i,
  "gluten-free": /\b(gluten[\s-]*free|gf|celiac)\b/i,
  "dairy-free": /\b(dairy[\s-]*free|lactose[\s-]*free)\b/i,
  pescatarian: /\bpescatarian\b/i,
};

function detectAllergen(q: string): string | null {
  for (const [name, re] of Object.entries(ALLERGEN_PATTERNS)) {
    if (re.test(q)) return name;
  }
  return null;
}

function detectDietary(q: string): string | null {
  for (const [name, re] of Object.entries(DIETARY_PATTERNS)) {
    if (re.test(q)) return name;
  }
  return null;
}

async function augmentFoodItem(foodItemId: string, base: any): Promise<any> {
  const [cfgRes, linksRes] = await Promise.all([
    db.from("KitchenConfig").select("key, value, label, notes"),
    db
      .from("FoodItemIngredient")
      .select("ingredient:Ingredient(id, name, allergens, notes)")
      .eq("foodItemId", foodItemId),
  ]);

  const config: Record<string, any> = {};
  const configNotes: Record<string, string> = {};
  for (const row of (cfgRes as any).data || []) {
    config[row.key] = row.value;
    if (row.notes) configNotes[row.key] = row.notes;
  }

  const inheritedAllergens = new Set<string>(base.allergens || []);
  const crossWarnings: string[] = [];

  const linkedIngredients: any[] = [];
  for (const link of (linksRes as any).data || []) {
    const ing = link.ingredient;
    if (!ing) continue;
    linkedIngredients.push(ing);
    for (const a of ing.allergens || []) inheritedAllergens.add(a);
  }

  const tagSet = new Set((base.tags || []).map((t: string) => t.toLowerCase()));
  const combinedText = (base.name + " " + (base.description || "") + " " + (base.ingredients || "")).toLowerCase();
  const isFried =
    tagSet.has("fried") ||
    /batter|fried|tender|fries|churro|chips/i.test(combinedText);
  const hasChips = /chips/i.test(combinedText);
  const onGrill = /grill|sizzle|seared|marinated/i.test(base.description + " " + (base.ingredients || ""));

  if (isFried && config.shared_fryer_gluten === true) {
    inheritedAllergens.add("gluten");
    crossWarnings.push(configNotes["shared_fryer_gluten"] || "Shared fryer contains gluten.");
  }
  if (isFried && config.shared_fryer_shellfish === true) {
    inheritedAllergens.add("shellfish");
    crossWarnings.push(configNotes["shared_fryer_shellfish"] || "Shared fryer contains shellfish.");
  }
  if (hasChips && config.chip_fryer_shares_gluten === true) {
    inheritedAllergens.add("gluten");
    const chipNote = configNotes["chip_fryer_shares_gluten"] || "Chips are fried in a shared fryer with gluten items — cross-contamination risk.";
    if (!crossWarnings.includes(chipNote)) crossWarnings.push(chipNote);
  }
  if (onGrill && config.shared_grill_shellfish === true && !tagSet.has("contains-shellfish")) {
    crossWarnings.push(configNotes["shared_grill_shellfish"] || "Shared grill contains shellfish.");
  }

  return {
    ...base,
    allergens: Array.from(inheritedAllergens),
    linkedIngredients,
    crossWarnings,
  };
}

function parseFoodItem(title: string, content: string, tags: string[]): any {
  const field = (label: string) => {
    const re = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
    const m = content.match(re);
    return m ? m[1].trim() : "";
  };

  const allergens = field("Contains")
    .split(/,\s*/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "none");

  const dietary = field("Dietary")
    .split(/,\s*/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "none");

  return {
    name: title,
    category: field("Category"),
    price: field("Price"),
    badge: field("Badge"),
    description: field("Description"),
    ingredients: field("Ingredients"),
    allergens,
    dietary,
    modifications: field("Modifications"),
    tags,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({
      answer: null,
      recipe: null,
      foodItem: null,
      foodList: null,
      aiAnswer: null,
      results: [],
    });
  }

  console.log("[search] query:", query);

  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  const cleaned = queryLower
    .replace(/how do (i|you) make (a |an |the )?/gi, "")
    .replace(/what('s| is| goes| comes| are) (in|on) (a |an |the )?/gi, "")
    .replace(/recipe (for )?(a |an |the )?/gi, "")
    .replace(/\b(recipe|spec|ingredients|what|how|make|whats|the|for|a|an)\b/gi, "")
    .replace(/[?!.,]/g, "")
    .trim();

  const listPattern = /\b(what|which|any|list|show|all|items?|options?|are|have|without|no|avoid)\b/i;
  const isListQuery = listPattern.test(query);
  const targetDietary = detectDietary(query);
  const targetAllergen = detectAllergen(query);

  // ─── Step 1: Dietary/Allergen List Queries ─────────────────────────────────
  if (isListQuery && (targetDietary || targetAllergen)) {
    const { data: allFood } = await db
      .from("SearchIndex")
      .select("*")
      .eq("contentType", "food");

    const tagMatches = (allFood || []).filter((item: any) => {
      const tagSet = new Set((item.tags || []).map((t: string) => t.toLowerCase()));
      if (targetDietary) {
        if (targetDietary === "vegan") return tagSet.has("vegan");
        if (targetDietary === "vegetarian")
          return tagSet.has("vegetarian") || tagSet.has("vegan");
        if (targetDietary === "gluten-free")
          return tagSet.has("gluten-free") || tagSet.has("gluten-friendly");
        if (targetDietary === "dairy-free")
          return tagSet.has("dairy-free") && !tagSet.has("contains-dairy");
        if (targetDietary === "pescatarian")
          return tagSet.has("pescatarian") || tagSet.has("vegetarian") || tagSet.has("vegan");
      }
      if (targetAllergen) {
        return !tagSet.has(`contains-${targetAllergen}`);
      }
      return false;
    });

    const excludedAllergen =
      targetAllergen ||
      (targetDietary === "gluten-free"
        ? "gluten"
        : targetDietary === "dairy-free"
        ? "dairy"
        : null);

    let matches = tagMatches;
    if (excludedAllergen) {
      const augmented = await Promise.all(
        tagMatches.map(async (item: any) => {
          const base = parseFoodItem(item.title, item.content, item.tags);
          const aug = await augmentFoodItem(item.id, base);
          return { raw: item, aug };
        })
      );
      matches = augmented
        .filter(({ aug }) => {
          const has = (aug.allergens || []).some((a: string) =>
            a.includes(excludedAllergen) || excludedAllergen.includes(a)
          );
          return !has;
        })
        .map(({ raw }) => raw);
    }

    if (matches.length > 0) {
      const items = matches.map((m: any) => parseFoodItem(m.title, m.content, m.tags));
      return NextResponse.json({
        answer: null,
        recipe: null,
        foodItem: null,
        foodList: {
          label: targetDietary
            ? targetDietary.replace(/-/g, " ") + " items"
            : `items without ${targetAllergen}`,
          items,
        },
        results: [],
      });
    }
  }

  // ─── Step 2: Recipe Match ──────────────────────────────────────────────────
  const { data: recipeIndex } = await db
    .from("SearchIndex")
    .select("*, module:Module(title, slug, section:Section(title, slug))")
    .eq("contentType", "recipe");

  const scoredRecipes = (recipeIndex || [])
    .map((item: any) => {
      const titleLower = item.title.toLowerCase();
      const allTags = (item.tags || []).map((t: string) => t.toLowerCase());
      let score = 0;
      if (cleaned && cleaned.length > 2) {
        if (titleLower.includes(cleaned)) score += 200;
        if (allTags.some((t: string) => t.includes(cleaned))) score += 150;
        const drinkWords = cleaned.split(/\s+/).filter((w) => w.length > 2);
        const matchCount = drinkWords.filter(
          (w) => titleLower.includes(w) || allTags.some((t: string) => t.includes(w))
        ).length;
        if (matchCount >= 2) score += 100;
      }
      for (const term of searchTerms) {
        if (allTags.includes(term)) score += 40;
        if (titleLower.includes(term)) score += 30;
      }
      return { ...item, score };
    })
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  if (scoredRecipes.length > 0 && scoredRecipes[0].score >= 50) {
    const top = scoredRecipes[0];
    const recipe = parseRecipe(top.title, top.content);
    return NextResponse.json({
      answer: null,
      foodItem: null,
      foodList: null,
      aiAnswer: null,
      recipe: {
        ...recipe,
        source: {
          title: top.module?.title || "",
          section: top.module?.section?.title || "",
          sectionSlug: top.module?.section?.slug || "",
          moduleSlug: top.module?.slug || "",
        },
      },
      results: [],
    });
  }

  // ─── Step 3: Food Item Match ───────────────────────────────────────────────
  const { data: foodIndex } = await db
    .from("SearchIndex")
    .select("*")
    .eq("contentType", "food");

  const scoredFood = (foodIndex || [])
    .map((item: any) => {
      const titleLower = item.title.toLowerCase();
      const allTags = (item.tags || []).map((t: string) => t.toLowerCase());
      let score = 0;
      if (cleaned && cleaned.length > 2) {
        if (titleLower.includes(cleaned)) score += 200;
        if (allTags.some((t: string) => t.includes(cleaned))) score += 120;
        const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
        const matchCount = words.filter(
          (w) => titleLower.includes(w) || allTags.some((t: string) => t.includes(w))
        ).length;
        if (matchCount >= 2) score += 100;
      }
      for (const term of searchTerms) {
        if (allTags.includes(term)) score += 35;
        if (titleLower.includes(term)) score += 25;
      }
      return { ...item, score };
    })
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  if (scoredFood.length > 0 && scoredFood[0].score >= 50) {
    const top = scoredFood[0];
    const base = parseFoodItem(top.title, top.content, top.tags);
    const foodItem = await augmentFoodItem(top.id, base);

    let allergyVerdict: { safe: boolean; text: string } | null = null;
    if (targetAllergen) {
      const contains = foodItem.allergens.some(
        (a: string) => a.includes(targetAllergen) || targetAllergen.includes(a)
      );
      const crossMatch = foodItem.crossWarnings.some((w: string) =>
        w.toLowerCase().includes(targetAllergen)
      );
      allergyVerdict = {
        safe: !contains && !crossMatch,
        text: contains
          ? `⚠️ ${foodItem.name} contains ${targetAllergen} — NOT safe for ${targetAllergen} allergies.`
          : crossMatch
          ? `⚠️ Cross-contamination risk: ${foodItem.crossWarnings.find((w: string) => w.toLowerCase().includes(targetAllergen)) || ""}`
          : `${foodItem.name} does not contain ${targetAllergen}. Always confirm with the kitchen for cross-contamination.`,
      };
    } else if (targetDietary) {
      const tagSet = new Set((top.tags || []).map((t: string) => t.toLowerCase()));
      let ok = false;
      if (targetDietary === "vegan") ok = tagSet.has("vegan");
      else if (targetDietary === "vegetarian")
        ok = tagSet.has("vegetarian") || tagSet.has("vegan");
      else if (targetDietary === "gluten-free")
        ok = tagSet.has("gluten-free") || tagSet.has("gluten-friendly");
      else if (targetDietary === "dairy-free")
        ok = tagSet.has("dairy-free") && !tagSet.has("contains-dairy");
      else if (targetDietary === "pescatarian")
        ok = tagSet.has("pescatarian") || tagSet.has("vegetarian") || tagSet.has("vegan");

      allergyVerdict = {
        safe: ok,
        text: ok
          ? `✓ ${foodItem.name} is ${targetDietary.replace(/-/g, " ")}.`
          : `${foodItem.name} is not strictly ${targetDietary.replace(/-/g, " ")} as written. See modifications below.`,
      };
    }

    return NextResponse.json({
      answer: null,
      recipe: null,
      foodList: null,
      aiAnswer: null,
      foodItem: { ...foodItem, verdict: allergyVerdict },
      results: [],
    });
  }

  // ─── Step 3.5: LLM for complex questions with no direct match ────────────
  if (shouldUseLLM(query)) {
    console.log("[search] no recipe/food match, calling LLM for:", query);
    const earlyLLM = await askLLM(query);
    if (earlyLLM) {
      return NextResponse.json({
        answer: null,
        recipe: null,
        foodItem: null,
        foodList: null,
        aiAnswer: earlyLLM,
        results: [],
      });
    }
  }

  // ─── Step 4: Module Content Search ─────────────────────────────────────────
  const { data: modules } = await db
    .from("Module")
    .select("id, title, slug, description, content, tags, section:Section(title, slug)")
    .eq("isActive", true);

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

  const scoredModules = (modules || [])
    .map((mod: any) => {
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
            snippet =
              (start > 0 ? "..." : "") +
              plainContent.substring(start, end).trim() +
              (end < plainContent.length ? "..." : "");
            break;
          }
        }
      }
      return {
        id: mod.id,
        type: "module" as const,
        title: mod.title,
        description: snippet || mod.description,
        sectionTitle: mod.section?.title || "",
        sectionSlug: mod.section?.slug || "",
        moduleSlug: mod.slug,
        tags: mod.tags || [],
        score,
      };
    })
    .filter((m: any) => m.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  let answer = null;
  if (scoredModules.length > 0 && scoredModules[0].score >= 10) {
    const top = scoredModules[0];
    answer = {
      text: top.description,
      source: {
        title: top.title,
        section: top.sectionTitle,
        sectionSlug: top.sectionSlug,
        moduleSlug: top.moduleSlug,
      },
      confidence: top.score >= 50 ? "high" : top.score >= 20 ? "medium" : "low",
    };
  }

  return NextResponse.json({
    answer,
    recipe: null,
    foodItem: null,
    foodList: null,
    aiAnswer: null,
    results: scoredModules.slice(0, 10),
  });
}

function parseRecipe(title: string, content: string): any {
  const name = title.replace(/ Recipe$/, "");
  const glassLine = content.match(/Glass:\s*([^\n]+)/i);
  let glass = "";
  let procedure = "";
  if (glassLine) {
    const parts = glassLine[1].split(/\s*\|\s*/);
    glass = parts[0].replace(/Procedure:.*$/i, "").trim();
    const procPart = glassLine[1].match(/Procedure:\s*(.+)/i);
    if (procPart) procedure = procPart[1].trim();
  }
  if (!procedure) {
    const procMatch = content.match(/^Procedure:\s*([^\n]+)/im);
    if (procMatch) procedure = procMatch[1].trim();
  }
  const garnishMatch = content.match(/Garnish:\s*([^\n]+)/i);
  const noteMatch = content.match(/Note:\s*([^\n]+)/i);
  const yieldMatch = content.match(/Yield:\s*([^\n|]+)/i);
  const shelfMatch = content.match(/Shelf Life:\s*([^\n|]+)/i);
  const priceMatch = content.match(/\((\$\d+)\)/);
  const ingredientsMatch = content.match(
    /Ingredients:\s*([\s\S]*?)(?=\nGarnish:|\nNote:|\nProcedure:|\n⚠|$)/i
  );
  let ingredients: string[] = [];
  if (ingredientsMatch) {
    const raw = ingredientsMatch[1].replace(/\n/g, ", ").trim();
    ingredients = raw
      .split(/,\s*/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
  }
  const hasNutWarning =
    content.includes("CONTAINS NUTS") || content.includes("NUT ALLERGY");
  return {
    name,
    glass,
    procedure,
    ingredients,
    garnish: garnishMatch ? garnishMatch[1].trim() : "",
    note: noteMatch ? noteMatch[1].trim() : "",
    price: priceMatch ? priceMatch[1] : "",
    yield: yieldMatch ? yieldMatch[1].trim() : "",
    shelfLife: shelfMatch ? shelfMatch[1].trim() : "",
    allergyWarning: hasNutWarning ? "⚠️ CONTAINS NUTS" : "",
  };
}
