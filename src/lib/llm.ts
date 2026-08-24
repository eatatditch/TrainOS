import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import { companyFactsPrompt } from "./company-facts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  timeout: 15_000,
  maxRetries: 1,
});

const MODEL = "claude-haiku-4-5-20251001";

async function buildMenuContext(
  accessibleModuleIds: ReadonlySet<string> | null,
): Promise<string> {
  const [foodRes, recipeRes, menuInfoRes, configRes, ingRes, linkRes, defRes] = await Promise.all([
    db.from("SearchIndex").select("id, title, content, tags").eq("contentType", "food"),
    db.from("SearchIndex").select("moduleId, title, content, tags").eq("contentType", "recipe"),
    db.from("SearchIndex").select("title, content, tags").eq("contentType", "menu-info"),
    db.from("KitchenConfig").select("key, value, label, notes").then(
      (r) => r,
      () => ({ data: [] as any[] })
    ),
    db.from("Ingredient").select("id, name, allergens, substitutes, notes").then(
      (r) => r,
      () => ({ data: [] as any[] })
    ),
    db.from("FoodItemIngredient").select("*").then(
      (r) => r,
      () => ({ data: [] as any[] })
    ),
    db.from("DietaryDefinition").select("*").order("sortOrder").then(
      (r) => r,
      () => ({ data: [] as any[] })
    ),
  ]);

  const sections: string[] = [];

  const defs = (defRes as any).data || [];
  if (defs.length > 0) {
    sections.push(
      "# DIETARY TERM DEFINITIONS (use these exact meanings; do not invent or soften)\n\n" +
        defs
          .map(
            (d: any) =>
              `- **${d.label}** (${d.key}): ${d.short_description} ${d.full_description}${
                d.safe_for_celiac === true
                  ? " [SAFE FOR CELIAC]"
                  : d.safe_for_celiac === false
                  ? " [NOT SAFE FOR CELIAC]"
                  : ""
              }`
          )
          .join("\n")
    );
  }

  const config = (configRes as any).data || [];
  if (config.length > 0) {
    sections.push(
      "# KITCHEN CONFIG (CRITICAL — applies to all items)\n\n" +
        config
          .map(
            (c: any) =>
              `- ${c.label || c.key}: ${JSON.stringify(c.value)}${c.notes ? ` — ${c.notes}` : ""}`
          )
          .join("\n")
    );
  }

  const ingredients = (ingRes as any).data || [];
  const links = (linkRes as any).data || [];
  const ingredientsByFoodId: Record<string, string[]> = {};
  const ingredientById: Record<string, any> = {};
  for (const ing of ingredients) ingredientById[ing.id] = ing;
  for (const link of links) {
    const name = ingredientById[link.ingredientId]?.name;
    if (!name) continue;
    if (!ingredientsByFoodId[link.foodItemId]) ingredientsByFoodId[link.foodItemId] = [];
    ingredientsByFoodId[link.foodItemId].push(name);
  }

  const linkedIngredientIds = new Set(
    links.map((link: any) => link.ingredientId).filter(Boolean),
  );
  const linkedIngredients = ingredients.filter((ingredient: any) =>
    linkedIngredientIds.has(ingredient.id),
  );
  if (linkedIngredients.length > 0) {
    sections.push(
      "# CURRENTLY LINKED INGREDIENT RECORDS (still require manager + kitchen verification)\n\n" +
        linkedIngredients
          .map(
            (ingredient: any) =>
              `- ${ingredient.name}: recorded flags [${(ingredient.allergens || []).join(", ") || "none recorded"}]${
                ingredient.substitutes?.length ? `, substitutes: [${ingredient.substitutes.join(", ")}]` : ""
              }${ingredient.notes ? ` — ${ingredient.notes}` : ""}`,
          )
          .join("\n"),
    );
  }

  if (foodRes.data && foodRes.data.length > 0) {
    sections.push(
      "# FOOD MENU\n\n" +
        foodRes.data
          .map((f: any) => {
            const linked = ingredientsByFoodId[f.id] || [];
            return `## ${f.title}\n${f.content}\nTags: ${(f.tags || []).join(", ")}${
              linked.length ? `\nLinked ingredients: ${linked.join(", ")}` : ""
            }`;
          })
          .join("\n\n---\n\n")
    );
  }

  const authorizedRecipes = (recipeRes.data || []).filter(
    (recipe) =>
      Boolean(recipe.moduleId) &&
      (accessibleModuleIds === null ||
        accessibleModuleIds.has(recipe.moduleId as string)),
  );
  if (authorizedRecipes.length > 0) {
    sections.push(
      "# COCKTAIL RECIPES\n\n" +
        authorizedRecipes
          .map(
            (r: any) =>
              `## ${r.title}\n${r.content}\nTags: ${(r.tags || []).join(", ")}`
          )
          .join("\n\n---\n\n")
    );
  }

  if (menuInfoRes.data && menuInfoRes.data.length > 0) {
    sections.push(
      "# CURRENT PRINTED OFFERS & BEVERAGE SNAPSHOTS\n\n" +
        menuInfoRes.data
          .map((item: any) => `## ${item.title}\n${item.content}\nTags: ${(item.tags || []).join(", ")}`)
          .join("\n\n---\n\n")
    );
  }

  return sections.join("\n\n═══════════════════════════════════════\n\n");
}

const SYSTEM_PROMPT = `You are SpecOS, an instant-answer assistant for Ditch restaurant staff during service. They are mid-shift and need fast, accurate answers.

COMPANY KNOWLEDGE — DITCH:
${companyFactsPrompt()}

INTERNAL TOOLS:
- Training platform: training.eatatditch.com (TrainOS — internal, for staff)
- Staff operations tool: specos.eatatditch.com (SpecOS — internal, for staff mid-shift lookups)

CONCEPT & VIBE:
- Coastal-inspired dining with a surf/beach culture vibe. Described publicly as "the local surf shack where coastal-inspired bites and fresh-squeezed cocktails meet laid-back, community-driven hospitality."
- Full bar, craft cocktails, menu focused on fresh seafood, tacos, burgers, and shareable plates. Mexican and American influences.
- Tagline/Vibe: Laid-back coastal energy, professional service, surf culture aesthetic.

WHAT YOU CAN ANSWER:
- Anything about the Ditch menu, cocktails, beer, wine, non-alcoholic beverages, ingredients, prep, and procedures (use the provided CONTEXT below for specifics).
- Questions about Ditch as a company: ownership, locations, opening dates, concept, history. Use the COMPANY KNOWLEDGE above.
- General hospitality and restaurant knowledge (cocktail technique, wine styles, pairings, service standards, beer categories, brewing basics, spirit categories).
- High-level definitions of common dietary terms. Do not diagnose, give medical advice, or select a dish for a medical condition.
- You may identify possible menu candidates only when the controlled context explicitly supports them. Every candidate still requires a manager and kitchen verification before the team makes a guest-facing promise.

HARD RULES:
1. NEVER invent Ditch menu items, prices, ingredients, or kitchen procedures. Those must come from the CONTEXT below.
2. The context can be incomplete or awaiting verification. Never infer that an item is free of an allergen because a tag, ingredient link, or warning is absent.
3. Use the DIETARY TERM DEFINITIONS exactly. "Gluten-friendly" and "gluten-free" are different; neither is a celiac clearance unless the current approved allergy procedure explicitly says so.
4. ALWAYS apply known KITCHEN CONFIG cross-contact warnings, but never treat the absence of a configured warning as proof of safety.
5. For every allergy, celiac, dietary-restriction, pregnancy, or medical query: use verdict "warning"; never say "safe," "does not contain," or "allergen-free"; do not promise a modification; and end with: "Manager and kitchen verification is required before serving."
6. Be concise. Staff are busy. 2-4 sentences max unless listing items. No fluff.
7. If you genuinely don't know something (not menu-related and outside basic restaurant/medical knowledge), say so — don't fabricate.

VERDICT GUIDANCE:
- "safe" → only a benign, non-food-safety workflow confirmation; NEVER use for allergy, dietary, celiac, pregnancy, or medical questions
- "warning" → caution needed (allergens, cross-contamination, condition-specific avoidance)
- "info" → general informational answer (e.g. "what is celiac disease")

Respond ONLY with a JSON object matching this exact shape:
{
  "verdict": "safe" | "warning" | "info",
  "title": "short headline, under 60 chars",
  "answer": "concise answer for the staff member",
  "items": ["Item Name 1", "Item Name 2"]
}

The "items" array should ONLY contain names of real Ditch menu items from the CONTEXT. Omit or leave empty if no items are relevant.

Do not wrap in markdown. Do not add commentary. Just the JSON object.`;

export interface LLMAnswer {
  verdict: "safe" | "warning" | "info";
  title: string;
  answer: string;
  items?: string[];
}

const SAFETY_QUERY =
  /\b(allerg(?:y|ic|en)|celiac|gluten|dairy|lactose|shellfish|shrimp|lobster|crab|nuts?|peanut|sesame|soy|egg|vegan|vegetarian|pescatarian|pregnan|medical|condition|disease|syndrome|intoleran|crohn|colitis|ibs|ibd|diabet(?:es|ic)|kidney|renal|gerd|reflux|hypertension|blood pressure|gout|fodmap|histamine|autoimmune|cross[- ]?contact|cross[- ]?contamin)/i;

function validateAnswer(query: string, value: unknown): LLMAnswer | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LLMAnswer>;
  if (
    !["safe", "warning", "info"].includes(candidate.verdict ?? "") ||
    typeof candidate.title !== "string" ||
    typeof candidate.answer !== "string"
  ) {
    return null;
  }

  const items = Array.isArray(candidate.items)
    ? candidate.items.filter((item): item is string => typeof item === "string").slice(0, 12)
    : [];
  const isSafetyQuery = SAFETY_QUERY.test(query);

  return {
    verdict: isSafetyQuery ? "warning" : candidate.verdict!,
    title: (isSafetyQuery ? "Manager + kitchen verification required" : candidate.title).slice(0, 80),
    answer: isSafetyQuery
      ? `${candidate.answer.replace(/\b(?:is|are) safe\b/gi, "may be a possible candidate").replace(/\bdoes not contain\b/gi, "is not currently flagged for").replace(/\ballergen[- ]free\b/gi, "allergen status unverified")} Manager and kitchen verification is required before serving.`.slice(0, 1_500)
      : candidate.answer.slice(0, 1_500),
    items: isSafetyQuery ? [] : items,
  };
}

export async function askLLM(
  query: string,
  accessibleModuleIds: ReadonlySet<string> | null,
): Promise<LLMAnswer | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[llm] skipped — ANTHROPIC_API_KEY not set");
    return null;
  }

  console.log("[llm] invoking authenticated SpecOS request");

  try {
    const context = await buildMenuContext(accessibleModuleIds);
    console.log("[llm] context built, length:", context.length);

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        {
          type: "text",
          text: `MENU & OPERATIONS CONTEXT:\n\n${context}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: query }],
    });

    console.log("[llm] response usage:", JSON.stringify(msg.usage));

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.warn("[llm] no text block in response");
      return null;
    }

    const raw = textBlock.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Try to extract JSON even when the model wraps it in extra text.
    let jsonStr = raw;
    if (!raw.startsWith("{")) {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = raw.substring(firstBrace, lastBrace + 1);
      }
    }

    try {
      const parsed = validateAnswer(query, JSON.parse(jsonStr));
      if (!parsed) {
        console.warn("[llm] parsed JSON missing or invalid required fields");
        return null;
      }
      console.log("[llm] success:", parsed.title);
      return parsed;
    } catch {
      console.error("[llm] JSON parse failed");
      // Fallback: if the model returned plain text instead of JSON, wrap it.
      if (raw.length > 10 && !raw.includes("{")) {
        console.log("[llm] falling back to plain-text wrapper");
        return validateAnswer(query, {
          verdict: "info",
          title: "AI Answer",
          answer: raw,
          items: [],
        });
      }
      return null;
    }
  } catch (err: any) {
    console.error("[llm] API error:", err?.message || err, err?.status);
    return null;
  }
}

export function shouldUseLLM(query: string): boolean {
  const trimmed = query.trim();
  // Very short queries are likely typos / partial dish names; let keyword search handle them.
  if (trimmed.length < 5) return false;
  const words = trimmed.split(/\s+/).filter((w) => w.length > 1);
  // Single-word queries are usually a dish/recipe lookup that keyword search handles.
  if (words.length < 2) return false;
  // Everything else (2+ words, questions, medical terms, pairings, vague asks) goes to the LLM.
  return true;
}
