"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  BookOpen,
  Loader2,
  Sparkles,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Brain,
  Info,
} from "lucide-react";
import { PalomaMan } from "@/components/paloma-man";
import { SurfingLoader } from "@/components/surfing-loader";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  sectionTitle: string;
  sectionSlug: string;
  moduleSlug: string;
  tags: string[];
}

interface Recipe {
  name: string;
  glass: string;
  procedure: string;
  ingredients: string[];
  garnish: string;
  note: string;
  price: string;
  yield: string;
  shelfLife: string;
  allergyWarning: string;
  source: { title: string; section: string; sectionSlug: string; moduleSlug: string };
}

interface Answer {
  text: string;
  source: { title: string; section: string; sectionSlug: string; moduleSlug: string };
  confidence: string;
}

interface FoodItem {
  name: string;
  category: string;
  price: string;
  badge: string;
  description: string;
  ingredients: string;
  allergens: string[];
  dietary: string[];
  modifications: string;
  tags: string[];
  crossWarnings?: string[];
  verdict?: { safe: boolean; text: string } | null;
}

interface FoodList {
  label: string;
  items: FoodItem[];
}

interface AIAnswer {
  verdict: "safe" | "warning" | "info";
  title: string;
  answer: string;
  items?: string[];
}

interface Definition {
  key: string;
  label: string;
  short_description: string;
  full_description: string;
  safe_for_celiac: boolean | null;
  icon: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [foodList, setFoodList] = useState<FoodList | null>(null);
  const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [expandedDef, setExpandedDef] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/dietary-definitions")
      .then((r) => r.json())
      .then((data) => setDefinitions(Array.isArray(data) ? data : []));
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setAnswer(null);
      setRecipe(null);
      setFoodItem(null);
      setFoodList(null);
      setAiAnswer(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    // Always keep the loader visible for at least 5s so the Paloma surfer
    // gets his moment even when the API responds quickly.
    const start = Date.now();
    try {
      const res = await fetch(`/api/search/answer?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setRecipe(data.recipe);
        setFoodItem(data.foodItem);
        setFoodList(data.foodList);
        setAiAnswer(data.aiAnswer);
        setResults(data.results || []);
      }
    } catch {
      // silent
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 5000) {
        await new Promise((r) => setTimeout(r, 5000 - elapsed));
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Search & Knowledge Center</h1>
        <p className="text-gray-500 mt-1">Ask anything about Ditch operations, recipes, menu, or allergens.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Try "Baja Fish Taco", "What is gluten-free?", or "recipe for a Mojito"...`}
          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-ditch-orange focus:ring-0 focus:outline-none text-base"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {!searched && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Hang 10 Marg",
              "Baja Fish Taco",
              "Gluten-free items",
              "Vegan options",
              "Is the Lobster Roll dairy-free?",
              "What should I pair with a margarita?",
              "Old Fashioned",
              "Big Al Burger",
              "Chicken Tortilla Soup",
              "Espresso Martini",
              "Core values",
              "Temperature danger zone",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-ditch-orange/10 hover:text-ditch-orange transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {searched && loading && (
        <SurfingLoader />
      )}

      {searched && !loading && recipe && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-ditch-navy px-5 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{recipe.name}</h2>
              {recipe.price && <span className="text-ditch-orange font-bold text-lg">{recipe.price}</span>}
            </div>
          </div>
          {recipe.allergyWarning && (
            <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">{recipe.allergyWarning}</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-2 font-semibold text-gray-700 w-[140px]">Glass</th>
                  <th className="text-left px-5 py-2 font-semibold text-gray-700">Ingredients</th>
                  <th className="text-left px-5 py-2 font-semibold text-gray-700 w-[180px]">Garnish</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-5 py-3 align-top border-r border-gray-100">
                    <p className="font-medium text-gray-900">{recipe.glass || "—"}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Procedure</p>
                      <p className="text-gray-700 mt-0.5">{recipe.procedure || "—"}</p>
                    </div>
                    {recipe.yield && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Yield</p>
                        <p className="text-gray-700 mt-0.5">{recipe.yield}</p>
                      </div>
                    )}
                    {recipe.shelfLife && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Shelf Life</p>
                        <p className="text-gray-700 mt-0.5">{recipe.shelfLife}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top border-r border-gray-100">
                    <div className="space-y-1">
                      {recipe.ingredients.map((ing, i) => (
                        <p key={i} className="text-gray-800">{ing}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <p className="text-gray-800">{recipe.garnish || "N/A"}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {recipe.note && (
            <div className="px-5 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500"><span className="font-semibold">Note:</span> {recipe.note}</p>
            </div>
          )}
          <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Source: {recipe.source.section} → {recipe.source.title}
            </span>
            <Link
              href={`/training/${recipe.source.sectionSlug}/${recipe.source.moduleSlug}`}
              className="text-xs text-ditch-orange hover:underline flex items-center gap-1"
            >
              View full module <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {searched && !loading && !recipe && foodItem && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-ditch-navy px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ditch-orange text-[10px] uppercase tracking-widest font-semibold">{foodItem.category}</p>
                <h2 className="text-white font-bold text-lg mt-0.5">{foodItem.name}</h2>
                {foodItem.badge && <p className="text-gray-300 text-xs mt-0.5">{foodItem.badge}</p>}
              </div>
              {foodItem.price && <span className="text-ditch-orange font-bold text-lg">{foodItem.price}</span>}
            </div>
          </div>

          {foodItem.verdict && (
            <div
              className={`px-5 py-2 flex items-start gap-2 border-b ${
                foodItem.verdict.safe ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
              }`}
            >
              {foodItem.verdict.safe ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <span className={`text-sm font-medium ${foodItem.verdict.safe ? "text-green-700" : "text-red-700"}`}>
                {foodItem.verdict.text}
              </span>
            </div>
          )}

          <div className="p-5 space-y-3">
            {foodItem.description && <p className="text-gray-700 text-sm leading-relaxed">{foodItem.description}</p>}

            {foodItem.ingredients && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Ingredients</p>
                <p className="text-gray-700 text-sm">{foodItem.ingredients}</p>
              </div>
            )}

            {foodItem.allergens.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contains</p>
                <div className="flex flex-wrap gap-2">
                  {foodItem.allergens.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium capitalize">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {foodItem.dietary.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dietary</p>
                <div className="flex flex-wrap gap-2">
                  {foodItem.dietary.map((d) => (
                    <span key={d} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium capitalize">
                      {d.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {foodItem.crossWarnings && foodItem.crossWarnings.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cross-contamination
                </p>
                <ul className="space-y-0.5">
                  {foodItem.crossWarnings.map((w, i) => (
                    <li key={i} className="text-red-700 text-xs">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {foodItem.modifications && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Modifications</p>
                <p className="text-gray-700 text-sm">{foodItem.modifications}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {searched && !loading && !recipe && !foodItem && foodList && foodList.items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-900 capitalize">{foodList.label}</h2>
            <span className="text-gray-500 text-sm">({foodList.items.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {foodList.items.map((item) => (
              <button
                key={item.name}
                onClick={() => setQuery(item.name)}
                className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-ditch-orange"
              >
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{item.category}</p>
                <div className="flex items-start justify-between gap-2 mt-0.5">
                  <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                  {item.price && <span className="text-ditch-orange font-bold text-sm shrink-0">{item.price}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {searched && !loading && !recipe && !foodItem && !foodList && aiAnswer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-2 bg-purple-50 border-b border-purple-100">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-widest">AI Assist</span>
          </div>
          <div
            className={`px-5 py-2 flex items-start gap-2 border-b ${
              aiAnswer.verdict === "safe"
                ? "bg-green-50 border-green-100"
                : aiAnswer.verdict === "warning"
                ? "bg-red-50 border-red-100"
                : "bg-orange-50 border-orange-100"
            }`}
          >
            {aiAnswer.verdict === "safe" ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            ) : aiAnswer.verdict === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            )}
            <span
              className={`text-sm font-semibold ${
                aiAnswer.verdict === "safe"
                  ? "text-green-700"
                  : aiAnswer.verdict === "warning"
                  ? "text-red-700"
                  : "text-orange-700"
              }`}
            >
              {aiAnswer.title}
            </span>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{aiAnswer.answer}</p>
            {aiAnswer.items && aiAnswer.items.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {aiAnswer.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-medium"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-500 pt-2 border-t border-gray-100">
              AI-generated · Always confirm allergen info with the kitchen.
            </p>
          </div>
        </div>
      )}

      {searched && !loading && !recipe && !foodItem && !foodList && !aiAnswer && answer && (
        <Card className="border-l-4 border-l-ditch-orange bg-ditch-orange/5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-ditch-orange/10 rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-ditch-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ditch-orange mb-2">Answer from Ditch Training</p>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{answer.text}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ditch-orange/20">
                <FileText className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">Source: {answer.source.section} → {answer.source.title}</span>
                <Link
                  href={`/training/${answer.source.sectionSlug}/${answer.source.moduleSlug}`}
                  className="text-xs text-ditch-orange hover:underline ml-auto flex items-center gap-1"
                >
                  View full module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {searched && !loading && !recipe && !foodItem && !foodList && !aiAnswer && results.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={`/training/${result.sectionSlug}/${result.moduleSlug}`}
              >
                <Card hover className="flex items-start gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                    <BookOpen className="w-5 h-5 text-ditch-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{result.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{result.description}</p>
                    {result.sectionTitle && (
                      <p className="text-xs text-gray-400 mt-1">{result.sectionTitle}</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {searched && !loading && !recipe && !foodItem && !foodList && !aiAnswer && !answer && results.length === 0 && (
        <EmptyState
          icon={Search}
          title="No Results Found"
          description="Try different keywords or check the spelling."
          action={
            <Link href="/training" className="text-ditch-orange hover:underline text-sm">
              Browse Training Library
            </Link>
          }
        />
      )}

      {/* Allergen Key — always visible at bottom */}
      {definitions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ditch-orange" />
            <span className="text-sm font-semibold text-gray-900">Allergen Key</span>
          </div>
          <div className="divide-y divide-gray-100">
            {definitions.map((d) => {
              const isExpanded = expandedDef === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setExpandedDef(isExpanded ? null : d.key)}
                  className="w-full px-5 py-2.5 flex items-start gap-3 text-left hover:bg-gray-50"
                >
                  {d.icon && <span className="text-lg leading-none mt-0.5">{d.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{d.label}</span>
                      {d.safe_for_celiac === true && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold uppercase">
                          Celiac-Safe
                        </span>
                      )}
                      {d.safe_for_celiac === false && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold uppercase">
                          NOT Celiac-Safe
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{d.short_description}</p>
                    {isExpanded && (
                      <p className="text-xs text-gray-700 mt-2 leading-relaxed whitespace-pre-line">
                        {d.full_description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="px-5 py-2 text-[10px] text-gray-400 border-t border-gray-100">
            Tap any term for the full explanation.
          </p>
        </div>
      )}

      <PalomaMan
        size="sm"
        position="bottom-right"
        dismissKey="search"
        message="Stuck? Type a full question — I can handle menu, allergens, and medical stuff too."
      />
    </div>
  );
}
