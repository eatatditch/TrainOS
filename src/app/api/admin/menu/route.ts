import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

// Serialize structured fields into the SearchIndex content format
function serializeContent(item: any): string {
  const lines: string[] = [];
  if (item.category) lines.push(`Category: ${item.category}`);
  if (item.price) lines.push(`Price: ${item.price}`);
  if (item.badge) lines.push(`Badge: ${item.badge}`);
  if (item.description) lines.push(`Description: ${item.description}`);
  if (item.ingredients) lines.push(`Ingredients: ${item.ingredients}`);
  lines.push(`Contains: ${item.allergens?.length ? item.allergens.join(", ") : "unverified"}`);
  lines.push(`Dietary: ${item.dietary?.length ? item.dietary.join(", ") : "unverified"}`);
  if (item.modifications) lines.push(`Modifications: ${item.modifications}`);
  return lines.join("\n");
}

// Auto-generate search tags from structured fields so dietary filters work
function buildTags(item: any, existingTags: string[] = []): string[] {
  const set = new Set<string>();
  set.add("food");
  if (item.category) set.add(item.category.toLowerCase());
  for (const a of item.allergens || []) set.add(`contains-${a}`);
  for (const d of item.dietary || []) set.add(d);
  for (const t of existingTags) {
    const lower = t.toLowerCase();
    if (lower.startsWith("contains-")) continue;
    if (["vegan", "vegetarian", "gluten-free", "gluten-friendly", "dairy-free", "dairy-free-friendly", "pescatarian"].includes(lower)) continue;
    set.add(lower);
  }
  return Array.from(set);
}

function parseContent(content: string) {
  const field = (label: string) => {
    const m = content.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
    return m ? m[1].trim() : "";
  };
  const list = (label: string) => {
    const v = field(label);
    if (!v || v === "none" || v === "unverified") return [];
    return v.split(/,\s*/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  };
  return {
    category: field("Category"),
    price: field("Price"),
    badge: field("Badge"),
    description: field("Description"),
    ingredients: field("Ingredients"),
    allergens: list("Contains"),
    dietary: list("Dietary"),
    modifications: field("Modifications"),
  };
}

async function syncIngredientLinks(foodItemId: string, input: unknown) {
  if (!Array.isArray(input)) return null;
  const ingredientIds: string[] = Array.from(
    new Set(input.filter((value): value is string => typeof value === "string" && value.length > 0)),
  );

  if (ingredientIds.length > 0) {
    const { data: ingredients, error } = await db
      .from("Ingredient")
      .select("id")
      .in("id", ingredientIds);
    if (error) return error.message;
    if ((ingredients || []).length !== ingredientIds.length) {
      return "One or more selected ingredients no longer exist";
    }
  }

  const { data: existing, error: existingError } = await db
    .from("FoodItemIngredient")
    .select("ingredientId")
    .eq("foodItemId", foodItemId);
  if (existingError) return existingError.message;

  const existingIds = new Set<string>((existing || []).map((link: any) => link.ingredientId));
  const additions = ingredientIds.filter((ingredientId) => !existingIds.has(ingredientId));
  if (additions.length > 0) {
    const { error } = await db.from("FoodItemIngredient").insert(
      additions.map((ingredientId) => ({ foodItemId, ingredientId })),
    );
    if (error) return error.message;
  }

  const desiredIds = new Set(ingredientIds);
  const removals = Array.from(existingIds).filter((ingredientId) => !desiredIds.has(ingredientId));
  if (removals.length > 0) {
    const { error } = await db
      .from("FoodItemIngredient")
      .delete()
      .eq("foodItemId", foodItemId)
      .in("ingredientId", removals);
    if (error) return error.message;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const { data } = await db.from("SearchIndex").select("*").eq("id", id).eq("contentType", "food").single();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: links } = await db
      .from("FoodItemIngredient")
      .select("ingredientId")
      .eq("foodItemId", id);

    return NextResponse.json({
      id: data.id,
      title: data.title,
      tags: data.tags || [],
      ...parseContent(data.content),
      ingredientIds: (links || []).map((l: any) => l.ingredientId),
    });
  }

  const { data } = await db
    .from("SearchIndex")
    .select("id, title, tags, content")
    .eq("contentType", "food")
    .order("title");

  const items = (data || []).map((d: any) => ({
    id: d.id,
    title: d.title,
    tags: d.tags || [],
    ...parseContent(d.content),
  }));

  return NextResponse.json(items);
}

export async function PUT(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const body = await request.json();
  const { id, title, tags, ingredientIds, ...fields } = body;
  if (!id || !title) return NextResponse.json({ error: "id and title required" }, { status: 400 });

  const content = serializeContent(fields);
  const finalTags = buildTags(fields, tags || []);

  const { error } = await db
    .from("SearchIndex")
    .update({ title, tags: finalTags, content })
    .eq("id", id)
    .eq("contentType", "food");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(ingredientIds)) {
    const linkError = await syncIngredientLinks(id, ingredientIds);
    if (linkError) return NextResponse.json({ error: linkError }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const body = await request.json();
  const { id, title, tags, ingredientIds, ...fields } = body;
  if (!id || !title) return NextResponse.json({ error: "id and title required" }, { status: 400 });

  const content = serializeContent(fields);
  const finalTags = buildTags(fields, tags || []);

  const { error } = await db.from("SearchIndex").insert({
    id,
    moduleId: "cur-server-food-menu",
    contentType: "food",
    title,
    content,
    tags: finalTags,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(ingredientIds) && ingredientIds.length > 0) {
    const linkError = await syncIngredientLinks(id, ingredientIds);
    if (linkError) {
      await db.from("SearchIndex").delete().eq("id", id);
      return NextResponse.json({ error: linkError }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { data: item, error: findError } = await db
    .from("SearchIndex")
    .select("tags")
    .eq("id", id)
    .eq("contentType", "food")
    .single();
  if (findError || !item) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

  const archivedTags = Array.from(new Set([...(item.tags || []), "archived"]));
  const { error } = await db
    .from("SearchIndex")
    .update({ contentType: "archived-food", tags: archivedTags })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
