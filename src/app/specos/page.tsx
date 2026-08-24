"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, X, LogOut, Mic, MicOff, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SurfingLoader } from "@/components/surfing-loader";
import { LoginScreen } from "./_login-screen";
import {
  RecipeCard,
  FoodItemCard,
  FoodListCard,
  type Recipe,
  type FoodItem,
  type FoodList,
} from "./_result-cards";
import {
  AIAnswerCard,
  ModuleAnswerCard,
  ModuleResultsList,
  AllergenKeyCard,
  type AIAnswer,
  type Answer,
  type SearchResult,
  type Definition,
} from "./_ai-extras";
import { useVoiceInput } from "./_use-voice";
import { DitchMark } from "@/components/brand/ditch-mark";

export default function SpecOSPage() {
  const [user, setUser] = useState<{ id: string; firstName?: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [query, setQuery] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [foodList, setFoodList] = useState<FoodList | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [expandedDef, setExpandedDef] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/auth/check", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        if (data.user?.mustResetPassword) {
          window.location.assign("/reset-password");
          return null;
        }
        return data.user ?? null;
      })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/dietary-definitions")
      .then((r) => r.json())
      .then((data) => setDefinitions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  const doSearch = useCallback(async (q: string) => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    if (!q.trim()) {
      setRecipe(null); setFoodItem(null); setFoodList(null);
      setAnswer(null); setAiAnswer(null); setResults([]);
      setSearchError("");
      setSearched(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setRecipe(null); setFoodItem(null); setFoodList(null);
    setAnswer(null); setAiAnswer(null); setResults([]);
    setSearchError("");
    setLoading(true);
    setSearched(true);
    const start = Date.now();
    try {
      const res = await fetch(`/api/search/answer?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "SpecOS could not complete that lookup.");
      const elapsed = Date.now() - start;
      if (elapsed < 600) await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
      if (requestId !== requestIdRef.current) return;
      setRecipe(data.recipe); setFoodItem(data.foodItem); setFoodList(data.foodList);
      setAnswer(data.answer); setAiAnswer(data.aiAnswer); setResults(data.results || []);
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setSearchError(error instanceof Error ? error.message : "SpecOS could not complete that lookup.");
    }
    finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const runSearch = (q: string) => { setQuery(q); doSearch(q); };

  const voice = useVoiceInput(
    (final) => { setQuery(final); doSearch(final); },
    (display) => setQuery(display)
  );

  useEffect(() => {
    if (user) inputRef.current?.focus();
    if (user && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/specos-sw.js", { scope: "/specos" })
        .catch(() => {});
    }
  }, [user]);

  const clearSearch = () => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setQuery(""); setRecipe(null); setFoodItem(null); setFoodList(null);
    setAnswer(null); setAiAnswer(null); setResults([]); setSearched(false); setLoading(false); setSearchError("");
    inputRef.current?.focus();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (checking) return <div className="min-h-screen bg-ditch-cream" />;
  if (!user) return <LoginScreen />;

  const chips = [
    { label: "Baja Fish Taco", icon: "🌮" }, { label: "Poké Bowl", icon: "🍣" },
    { label: "Lobster Roll", icon: "🦞" }, { label: "Big Al Burger", icon: "🍔" },
    { label: "Gluten-free items", icon: "🌾" }, { label: "Vegan options", icon: "🥬" },
    { label: "Chips + Guac", icon: "🥑" }, { label: "Korean Chicken Sammy", icon: "🍗" },
    { label: "Sirloin Steak", icon: "🥩" }, { label: "Churros", icon: "🍩" },
    { label: "Taco 12-pack", icon: "🌮" },
  ];

  const showEmpty = searched && !loading && !searchError && !recipe && !foodItem && !foodList && !aiAnswer && !answer && results.length === 0;

  return (
    <div className="app-canvas flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ditch-navy/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <button type="button" onClick={clearSearch} className="rounded-xl text-left">
            <DitchMark inverse product="SpecOS" />
          </button>
          <button type="button" onClick={handleSignOut} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white/45 transition-colors hover:bg-white/[0.07] hover:text-white">
            <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-6">
        <div className={`transition-all duration-300 ${!searched ? "flex flex-1 flex-col justify-center py-10" : "pt-7"}`}>
          {!searched && (
            <div className="mb-8 text-center">
              <span className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-ditch-sand/60 text-ditch-orange shadow-sm">
                <Sparkles className="size-5" />
              </span>
              <p className="page-kicker">Your on-shift copilot</p>
              <h2 className="text-4xl font-black tracking-[-0.055em] text-ditch-ink sm:text-5xl">What do you need?</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ditch-navy/55">Ask for a cocktail spec, menu detail, allergen note, or operating standard.</p>
            </div>
          )}
          <form role="search" onSubmit={(e) => { e.preventDefault(); doSearch(query); inputRef.current?.blur(); }} className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ditch-navy/35" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={voice.listening ? "Listening... speak your question" : "Search or ask a question..."}
              className={`search-field py-4 pl-12 pr-24 text-base sm:py-5 ${voice.listening ? "border-ditch-orange placeholder:text-ditch-orange/70" : ""}`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {voice.supported && (
                <button type="button" onClick={voice.toggle} aria-label={voice.listening ? "Stop listening" : "Ask by voice"} className={`rounded-xl p-2 transition-colors ${voice.listening ? "animate-pulse bg-ditch-orange text-white" : "text-ditch-navy/40 hover:bg-ditch-navy/[0.06] hover:text-ditch-orange"}`}>
                  {voice.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              {loading && <Loader2 className="w-5 h-5 text-ditch-orange animate-spin mr-2" />}
              {!loading && !voice.listening && query && (
                <button type="button" onClick={clearSearch} aria-label="Clear" className="rounded-xl p-2 text-ditch-navy/40 hover:bg-ditch-navy/[0.06]"><X className="w-4 h-4" /></button>
              )}
            </div>
          </form>
          {voice.listening && (
            <p className="mt-2 text-center text-xs text-ditch-orange animate-pulse">
              Listening — pause for a moment when you&apos;re done and I&apos;ll search.
            </p>
          )}
        </div>

        {!searched && (
          <div className="mb-10 mt-7">
            <div className="flex flex-wrap gap-2 justify-center">
              {chips.map((q) => (
                <button type="button" key={q.label} onClick={() => runSearch(q.label)} className="flex items-center gap-1.5 rounded-full border border-ditch-navy/10 bg-white px-3.5 py-2 text-xs font-semibold text-ditch-navy/65 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ditch-orange/40 hover:text-ditch-orange">
                  <span>{q.icon}</span>{q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {searched && loading && (<div className="mt-6 mb-8"><SurfingLoader /></div>)}
        {searched && !loading && recipe && (<div className="mt-6 mb-8"><RecipeCard recipe={recipe} /></div>)}
        {searched && !loading && !recipe && foodItem && (<div className="mt-6 mb-8"><FoodItemCard foodItem={foodItem} /></div>)}
        {searched && !loading && !recipe && !foodItem && foodList && foodList.items.length > 0 && (
          <div className="mt-6 mb-8"><FoodListCard foodList={foodList} onItemClick={runSearch} /></div>
        )}
        {searched && !loading && !recipe && !foodItem && !foodList && aiAnswer && (
          <div className="mt-6 mb-8"><AIAnswerCard aiAnswer={aiAnswer} onItemClick={runSearch} /></div>
        )}
        {searched && !loading && !recipe && !foodItem && !foodList && !aiAnswer && answer && (
          <div className="mt-6 mb-8"><ModuleAnswerCard answer={answer} /></div>
        )}
        {searched && !loading && !recipe && !foodItem && !foodList && !aiAnswer && results.length > 0 && (
          <div className="mt-4 mb-8"><ModuleResultsList results={results} /></div>
        )}
        {showEmpty && (<div className="shell-card mt-6 p-8 text-center"><p className="text-sm text-ditch-navy/55">No result for that one. Try a dish name, recipe, or a simpler question.</p></div>)}
        {searched && !loading && searchError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
            {searchError} No previous result is being shown. Verify urgent allergy questions directly with a manager and the kitchen.
          </div>
        ) : null}

        <div className="mt-6 mb-8">
          <AllergenKeyCard definitions={definitions} expandedDef={expandedDef} onToggle={(key) => setExpandedDef(expandedDef === key ? null : key)} />
        </div>
      </main>

      <footer className="border-t border-ditch-navy/10 bg-white/60 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ditch-navy/35">SpecOS · Ditch</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ditch-navy/35">Team only</p>
        </div>
      </footer>
    </div>
  );
}
