"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, AlertTriangle, X, Sparkles, CheckCircle2, Leaf, Brain, Info, Utensils, BookOpen } from "lucide-react";
import { PalomaMan } from "@/components/paloma-man";
import { SurfingLoader } from "@/components/surfing-loader";

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
  allergyStatus: string;
  allergyWarning: string;
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

export default function MenuPage() {
  const [query, setQuery] = useState("");
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [foodList, setFoodList] = useState<FoodList | null>(null);
  const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [expandedDef, setExpandedDef] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/dietary-definitions")
      .then((r) => r.json())
      .then((data) => setDefinitions(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const doSearch = useCallback(async (q: string) => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    if (!q.trim()) {
      setFoodItem(null);
      setFoodList(null);
      setAiAnswer(null);
      setSearchError("");
      setSearched(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setFoodItem(null);
    setFoodList(null);
    setAiAnswer(null);
    setSearchError("");
    setLoading(true);
    setSearched(true);
    // Keep a brief loading transition so results do not visually flicker.
    const start = Date.now();
    try {
      const res = await fetch(`/api/search/answer?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Menu lookup failed. Try again.");
      const elapsed = Date.now() - start;
      if (elapsed < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
      }
      if (requestId !== requestIdRef.current) return;
      setFoodItem(data.foodItem);
      setFoodList(data.foodList);
      setAiAnswer(data.aiAnswer);
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setSearchError(error instanceof Error ? error.message : "Menu lookup failed. Try again.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const runSearch = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

  const clearSearch = () => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setQuery("");
    setFoodItem(null);
    setFoodList(null);
    setAiAnswer(null);
    setSearchError("");
    setSearched(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] bg-ditch-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border-[72px] border-ditch-seafoam/[0.07]" />
        <div className="relative">
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-ditch-seafoam">Menu intelligence</p>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          <Utensils className="size-7 text-ditch-orange" /> Know what we serve.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          Find a dish, ingredient, dietary option, or allergen note before you answer the guest.
        </p>
        </div>

      <form role="search" onSubmit={(e) => { e.preventDefault(); doSearch(query); inputRef.current?.blur(); }} className="relative mt-7">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ditch-navy/35" />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a dish, ask a question, or filter by diet..."
          className="search-field py-4 pl-12 pr-12 text-base"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ditch-orange animate-spin" />}
        {query && !loading && (
          <button type="button" aria-label="Clear search" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 hover:bg-ditch-navy/[0.06]">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </form>
      </section>

      {!searched && (
        <div>
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ditch-navy/45">Quick lookups</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Gluten-free items",
            "Vegan options",
            "Dairy-free items",
            "Items without shellfish",
            "Pescatarian options",
            "Baja Fish Taco",
            "Lobster Roll",
            "Poke Bowl",
            "Taco 12-pack",
          ].map((label) => (
            <button
              key={label}
              onClick={() => runSearch(label)}
              className="rounded-full border border-ditch-navy/10 bg-white px-3.5 py-2 text-xs font-semibold text-ditch-navy/65 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ditch-orange/40 hover:text-ditch-orange"
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      )}

      {searched && loading && (
        <SurfingLoader />
      )}

      {searched && !loading && searchError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
          {searchError} No previous result is being shown. Verify urgent allergy questions directly with a manager and the kitchen.
        </div>
      ) : null}

      {searched && !loading && foodItem && (
        <div className="overflow-hidden rounded-[1.75rem] border border-ditch-navy/10 bg-white shadow-[var(--shadow-lift)]">
          <div className="bg-gradient-to-r from-ditch-navy to-ditch-navy/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ditch-orange text-xs uppercase tracking-widest font-semibold">{foodItem.category}</p>
                <h2 className="text-white font-bold text-xl mt-0.5">{foodItem.name}</h2>
                {foodItem.badge && <p className="text-gray-300 text-xs mt-0.5">{foodItem.badge}</p>}
              </div>
              {foodItem.price && <span className="text-ditch-orange font-bold text-xl">{foodItem.price}</span>}
            </div>
          </div>

          {foodItem.verdict && (
            <div
              className={`px-6 py-3 flex items-start gap-2 border-b ${
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

          <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-6 py-3" role="note">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                {foodItem.allergyStatus || "Verification required"}
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">{foodItem.allergyWarning}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {foodItem.description && <p className="text-gray-700 text-sm leading-relaxed">{foodItem.description}</p>}

            {foodItem.ingredients && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Ingredients</p>
                <p className="text-gray-700 text-sm">{foodItem.ingredients}</p>
              </div>
            )}

            {foodItem.allergens.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Contains</p>
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
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Dietary</p>
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
                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cross-contamination
                </p>
                <ul className="space-y-1">
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

      {searched && !loading && !foodItem && foodList && foodList.items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-900 capitalize">{foodList.label}</h2>
            <span className="text-gray-500 text-sm">({foodList.items.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {foodList.items.map((item) => (
              <button
                key={item.name}
                onClick={() => runSearch(item.name)}
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

      {searched && !loading && !foodItem && !foodList && aiAnswer && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 bg-purple-50 border-b border-purple-100">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-widest">AI Assist</span>
          </div>
          <div
            className={`px-6 py-3 flex items-start gap-2 border-b ${
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
          <div className="p-6 space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{aiAnswer.answer}</p>
            {aiAnswer.items && aiAnswer.items.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {aiAnswer.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => runSearch(item)}
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

      {searched && !loading && !searchError && !foodItem && !foodList && !aiAnswer && (
        <div className="text-center py-8">
          <Sparkles className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No results found. Try a different search.</p>
        </div>
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
        dismissKey="menu"
        message="Guest asking about allergens? Tap a dish — I'll show what's in it."
      />
    </div>
  );
}
