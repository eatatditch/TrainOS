"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Utensils, Flame, Package, Plus, Settings, BookOpen } from "lucide-react";

interface FoodItem {
  id: string;
  title: string;
  category: string;
  price: string;
  allergens: string[];
  dietary: string[];
  tags: string[];
}

export default function MenuAdminPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/menu")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean).sort();

  const filtered = items.filter((i) => {
    const matchesSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu & Kitchen</h1>
          <p className="text-gray-500 mt-1">Edit menu items, ingredients, and kitchen config. Changes are live instantly in SpecOS.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/menu/kitchen">
            <Button variant="secondary" className="flex items-center gap-2">
              <Flame className="w-4 h-4" /> Kitchen Config
            </Button>
          </Link>
          <Link href="/admin/menu/ingredients">
            <Button variant="secondary" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Ingredients
            </Button>
          </Link>
          <Link href="/admin/menu/definitions">
            <Button variant="secondary" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Definitions
            </Button>
          </Link>
          <Link href="/admin/menu/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Item
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput placeholder="Search menu..." onSearch={setSearch} className="flex-1 min-w-[200px]" />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1.5 text-sm rounded-full border ${
              !categoryFilter ? "bg-ditch-orange text-white border-ditch-orange" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 text-sm rounded-full border ${
                categoryFilter === c ? "bg-ditch-orange text-white border-ditch-orange" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No items"
          description={search || categoryFilter ? "Try different filters." : "Add your first menu item."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <Link key={item.id} href={`/admin/menu/${item.id}`}>
              <Card hover className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-ditch-orange uppercase font-semibold">{item.category}</p>
                    {item.price && <span className="text-xs text-gray-500">· {item.price}</span>}
                  </div>
                  <h3 className="font-medium text-gray-900 mt-0.5">{item.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.allergens.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-medium capitalize">
                        {a}
                      </span>
                    ))}
                    {item.dietary.map((d) => (
                      <span key={d} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-medium capitalize">
                        {d.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
                <Settings className="w-4 h-4 text-gray-400 shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
