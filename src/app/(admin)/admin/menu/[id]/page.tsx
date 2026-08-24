"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2 } from "lucide-react";

const ALLERGEN_OPTIONS = ["gluten", "dairy", "egg", "fish", "shellfish", "soy", "nut", "sesame"];
const DIETARY_OPTIONS = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "gluten-friendly",
  "dairy-free",
  "dairy-free-friendly",
  "pescatarian",
];
const CATEGORIES = ["Share + Socialize", "Soup + Salads", "Tacos", "Sides", "Bowls", "Platos", "Handhelds", "Dessert"];

interface Ingredient {
  id: string;
  name: string;
  allergens: string[];
}

interface FoodForm {
  id: string;
  title: string;
  category: string;
  price: string;
  badge: string;
  description: string;
  ingredients: string;
  allergens: string[];
  dietary: string[];
  modifications: string;
  tags: string[];
  ingredientIds: string[];
}

const empty: FoodForm = {
  id: "",
  title: "",
  category: "",
  price: "",
  badge: "",
  description: "",
  ingredients: "",
  allergens: [],
  dietary: [],
  modifications: "",
  tags: [],
  ingredientIds: [],
};

export default function MenuItemEditorPage() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const isNew = params.id === "new";

  const [form, setForm] = useState<FoodForm>(empty);
  const [ingredientLibrary, setIngredientLibrary] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadIngredients = fetch("/api/admin/ingredients").then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not load ingredients");
      return data;
    });
    if (isNew) {
      loadIngredients.then((data) => {
        setIngredientLibrary(Array.isArray(data) ? data : []);
        setForm({ ...empty, id: `food-${Date.now()}` });
        setLoading(false);
      }).catch((loadError) => { setError(loadError instanceof Error ? loadError.message : "Could not load menu editor"); setLoading(false); });
    } else {
      Promise.all([
        fetch(`/api/admin/menu?id=${encodeURIComponent(params.id)}`).then(async (response) => {
          const data = await response.json().catch(() => null);
          if (!response.ok) throw new Error(data?.error || "Could not load menu item");
          return data;
        }),
        loadIngredients,
      ]).then(([item, ings]) => {
        if (item && !item.error) {
          setForm({
            id: item.id,
            title: item.title || "",
            category: item.category || "",
            price: item.price || "",
            badge: item.badge || "",
            description: item.description || "",
            ingredients: item.ingredients || "",
            allergens: item.allergens || [],
            dietary: item.dietary || [],
            modifications: item.modifications || "",
            tags: item.tags || [],
            ingredientIds: item.ingredientIds || [],
          });
        }
        setIngredientLibrary(Array.isArray(ings) ? ings : []);
        setLoading(false);
      }).catch((loadError) => { setError(loadError instanceof Error ? loadError.message : "Could not load menu editor"); setLoading(false); });
    }
  }, [params.id, isNew]);

  const toggle = (field: "allergens" | "dietary", v: string) => {
    setForm({
      ...form,
      [field]: form[field].includes(v) ? form[field].filter((x) => x !== v) : [...form[field], v],
    });
  };

  const toggleIngredient = (id: string) => {
    setForm({
      ...form,
      ingredientIds: form.ingredientIds.includes(id)
        ? form.ingredientIds.filter((x) => x !== id)
        : [...form.ingredientIds, id],
    });
  };

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    setError("");
    const method = isNew ? "POST" : "PUT";
    try {
      const response = await fetch("/api/admin/menu", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not save menu item");
      router.push("/admin/menu");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save menu item");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Archive "${form.title}" from the live menu? Its history will be preserved.`)) return;
    setError("");
    const response = await fetch(`/api/admin/menu?id=${encodeURIComponent(form.id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.error || "Could not archive menu item"); return; }
    router.push("/admin/menu");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/menu" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? "New Menu Item" : form.title}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Changes are live in SpecOS immediately after save.</p>
          </div>
        </div>
        {!isNew && (
          <button
            onClick={remove}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg"
            title="Archive"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Baja Fish Taco"
            />
            <Input
              label="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="$5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
              >
                <option value="">—</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label="Badge (optional)"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              placeholder="Signature, Shareable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
              placeholder="Beer-battered fish, chipotle crema, cabbage slaw, pico de gallo."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (free text)</label>
            <textarea
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
              placeholder="cod, beer batter, chipotle crema, cabbage slaw, pico de gallo, corn or flour tortilla"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Allergens (direct)</h3>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggle("allergens", a)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border capitalize transition-colors ${
                form.allergens.includes(a)
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Linked ingredients below will add their allergens automatically — you don't need to duplicate.
        </p>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Dietary</h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggle("dietary", d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border capitalize transition-colors ${
                form.dietary.includes(d)
                  ? "bg-ditch-green text-white border-ditch-green"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              }`}
            >
              {d.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Linked Ingredients</h3>
          <Link href="/admin/menu/ingredients" className="text-xs text-ditch-orange hover:underline">
            Manage library →
          </Link>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Tick ingredients that this item contains. When you change an ingredient, every linked item updates automatically.
        </p>
        <div className="max-h-[300px] overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2">
          {ingredientLibrary.map((ing) => (
            <label key={ing.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={form.ingredientIds.includes(ing.id)}
                onChange={() => toggleIngredient(ing.id)}
                className="mt-1 rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-900">{ing.name}</span>
                  {ing.allergens.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-medium capitalize">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Modifications / Notes</h3>
        <textarea
          value={form.modifications}
          onChange={(e) => setForm({ ...form, modifications: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-ditch-orange focus:ring-0 focus:outline-none"
          placeholder="Document approved modifications and required manager/kitchen verification. Never infer allergen safety."
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Search Tags</h3>
        <Input
          value={form.tags.join(", ")}
          onChange={(e) => setForm({ ...form, tags: e.target.value.split(/,\s*/).map((t) => t.trim()).filter(Boolean) })}
          placeholder="food, taco, signature, contains-fish"
        />
        <p className="text-xs text-gray-500 mt-2">Comma-separated. These power quick dietary filters in SpecOS.</p>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/admin/menu">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button onClick={save} disabled={saving || !form.title}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
