import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = "claude-haiku-4-5-20251001";

async function buildMenuContext(): Promise<string> {
  const [foodRes, recipeRes, configRes, ingRes, linkRes, defRes] = await Promise.all([
    db.from("SearchIndex").select("id, title, content, tags").eq("contentType", "food"),
    db.from("SearchIndex").select("title, content, tags").eq("contentType", "recipe"),
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
  if (ingredients.length > 0) {
    sections.push(
      "# INGREDIENT LIBRARY (allergens flow from these to any linked dish)\n\n" +
        ingredients
          .map(
            (i: any) =>
              `- ${i.name}: contains [${(i.allergens || []).join(", ") || "none"}]${
                i.substitutes?.length ? `, substitutes: [${i.substitutes.join(", ")}]` : ""
              }${i.notes ? ` — ${i.notes}` : ""}`
          )
          .join("\n")
    );
  }

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

  if (recipeRes.data && recipeRes.data.length > 0) {
    sections.push(
      "# COCKTAIL RECIPES\n\n" +
        recipeRes.data
          .map(
            (r: any) =>
              `## ${r.title}\n${r.content}\nTags: ${(r.tags || []).join(", ")}`
          )
          .join("\n\n---\n\n")
    );
  }

  return sections.join("\n\n═══════════════════════════════════════\n\n");
}

const SYSTEM_PROMPT = `You are SpecOS, an instant-answer assistant for Ditch restaurant staff during service. They are mid-shift and need fast, accurate answers.

COMPANY KNOWLEDGE — DITCH:
- Full name: Ditch (also known as "The Ditch", "Ditch Dining")
- Owner: Tracy Smith (sole owner — if anyone asks "who owns Ditch", the ONLY answer is Tracy Smith)
- Locations:
  - Ditch Bay Shore — the original flagship. Located in Bay Shore, Long Island, New York. Opened in 2023.
  - Ditch Port Jefferson — the second location. Located in Port Jefferson, Long Island, New York. Opened in 2025.
- Total locations: 2 (Bay Shore and Port Jefferson)
- Concept: Coastal-inspired dining with a surf/beach culture vibe. Full bar, craft cocktails, and a menu focused on fresh seafood, tacos, burgers, and shareable plates.
- Tagline/Vibe: Laid-back coastal energy, professional service, surf culture aesthetic.
- Website: eatatditch.com
- Training platform: training.eatatditch.com (TrainOS)
- Staff operations tool: specos.eatatditch.com (SpecOS)

WHAT YOU CAN ANSWER:
- Anything about the Ditch menu, cocktails, beer, wine, non-alcoholic beverages, ingredients, prep, and procedures (use the provided CONTEXT below for specifics).
- Questions about Ditch as a company: ownership, locations, opening dates, concept, history. Use the COMPANY KNOWLEDGE above.
- General hospitality and restaurant knowledge (cocktail technique, wine styles, pairings, service standards, beer categories, brewing basics, spirit categories).
- General medical, dietary, and allergy knowledge that helps staff understand guest needs: what a condition is (celiac, Crohn's disease, IBS, IBD, diabetes, lactose intolerance, histamine intolerance, gout, kidney disease, GERD, heart disease, hypertension, pregnancy considerations, low-FODMAP, keto, paleo, etc.), what triggers or worsens it, what foods are generally advisable or to avoid.
- When a guest has a condition or restriction, use your general knowledge to identify which specific Ditch menu items in the CONTEXT below would be best, worst, or modifiable to fit their needs.

HARD RULES:
1. NEVER invent Ditch menu items, prices, ingredients, or kitchen procedures. Those must come from the CONTEXT below.
2. When recommending dishes for a condition, only name dishes that actually exist in the FOOD MENU context. Cross-reference their allergens/dietary tags/cross-warnings.
3. Use the DIETARY TERM DEFINITIONS verbatim — "gluten-friendly" is NOT safe for celiac. Do not soften it.
4. ALWAYS apply KITCHEN CONFIG cross-contamination rules (shared fryer, shared grill, etc.) when recommending or assessing an item.
5. For allergy/medical questions touching guest safety, end the answer with: "Confirm with the kitchen before serving." and note "This is general info — guests with serious conditions should consult their doctor."
6. Be concise. Staff are busy. 2-4 sentences max unless listing items. No fluff.
7. If you genuinely don't know something (not menu-related and outside basic restaurant/medical knowledge), say so — don't fabricate.

VERDICT GUIDANCE:
- "safe" → recommended item(s) clearly work
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

export async function askLLM(query: string): Promise<LLMAnswer | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[llm] skipped — ANTHROPIC_API_KEY not set");
    return null;
  }

  console.log("[llm] invoking for query:", query);

  try {
    const context = await buildMenuContext();
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

    try {
      const parsed = JSON.parse(raw) as LLMAnswer;
      if (!parsed.verdict || !parsed.answer) {
        console.warn("[llm] parsed JSON missing required fields:", raw);
        return null;
      }
      console.log("[llm] success:", parsed.title);
      return parsed;
    } catch (parseErr) {
      console.error("[llm] JSON parse failed. Raw response:", raw);
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
