import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

async function assertAdmin() {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) return false;
  return true;
}

// Serialize structured fields into the SearchIndex content format
function serializeContent(item: any): string {
  const lines: string[] = [];
  if (item.category) lines.push(`Category: ${item.category}`);
  if (item.price) lines.push(`Price: ${item.price}`);
  if (item.badge) lines.push(`Badge: ${item.badge}`);
  if (item.description) lines.push(`Description: ${item.description}`);
  if (item.ingredients) lines.push(`Ingredients: ${item.ingredients}`);
  lines.push(`Contains: ${item.allergens?.length ? item.allergens.join(", ") : "none"}`);
  lines.push(`Dietary: ${item.dietary?.length ? item.dietary.join(", ") : "none"}`);
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
    if (["vegan", "vegetarian", "gluten-free", "gluten-free-friendly", "dairy-free", "dairy-free-friendly", "pescatarian"].includes(lower)) continue;
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
    if (!v || v === "none") return [];
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

export async function GET(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const { data } = await db.from("SearchIndex").select("*").eq("id", id).single();
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
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, title, tags, ingredientIds, ...fields } = body;
  if (!id || !title) return NextResponse.json({ error: "id and title required" }, { status: 400 });

  const content = serializeContent(fields);
  const finalTags = buildTags(fields, tags || []);

  const { error } = await db
    .from("SearchIndex")
    .update({ title, tags: finalTags, content })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(ingredientIds)) {
    await db.from("FoodItemIngredient").delete().eq("foodItemId", id);
    if (ingredientIds.length > 0) {
      const rows = ingredientIds.map((ingredientId: string) => ({
        foodItemId: id,
        ingredientId,
      }));
      await db.from("FoodItemIngredient").insert(rows);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, title, tags, ingredientIds, ...fields } = body;
  if (!id || !title) return NextResponse.json({ error: "id and title required" }, { status: 400 });

  const content = serializeContent(fields);
  const finalTags = buildTags(fields, tags || []);

  const { error } = await db.from("SearchIndex").insert({
    id,
    moduleId: "mod-menu-food",
    contentType: "food",
    title,
    content,
    tags: finalTags,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(ingredientIds) && ingredientIds.length > 0) {
    const rows = ingredientIds.map((ingredientId: string) => ({
      foodItemId: id,
      ingredientId,
    }));
    await db.from("FoodItemIngredient").insert(rows);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.from("FoodItemIngredient").delete().eq("foodItemId", id);
  await db.from("SearchIndex").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
