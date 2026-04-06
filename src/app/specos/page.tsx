"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, AlertTriangle, X, Sparkles, Zap, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ditch-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">SpecOS</h1>
          <p className="text-gray-500 text-sm">Sign in with your Ditch account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-ditch-orange focus:ring-0 focus:outline-none text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-ditch-orange focus:ring-0 focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ditch-orange text-white font-medium rounded-xl hover:bg-ditch-orange/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-gray-700 text-xs text-center mt-8">Ditch Internal Use Only</p>
      </div>
    </div>
  );
}

// ─── Main SpecOS App ─────────────────────────────────────────────────────────
export default function SpecOSPage() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [query, setQuery] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check Supabase auth session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setRecipe(null);
      setAnswer(null);
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search/answer?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setRecipe(data.recipe);
        setAnswer(data.answer);
        setResults(data.results || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    if (user) inputRef.current?.focus();
    if (user && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/specos-sw.js").catch(() => {});
    }
  }, [user]);

  const clearSearch = () => {
    setQuery("");
    setRecipe(null);
    setAnswer(null);
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (checking) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={clearSearch} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ditch-orange rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-white font-bold text-lg leading-none">SpecOS</h1>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">by Ditch</p>
            </div>
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
        <div className={`transition-all duration-300 ${!searched ? "flex-1 flex flex-col justify-center -mt-16" : "pt-6"}`}>
          {!searched && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">What do you need?</h2>
              <p className="text-gray-500 text-sm">Cocktail specs, recipes, procedures — instant answers.</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); inputRef.current?.blur(); }} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes, specs, or ask a question..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-ditch-orange focus:ring-0 focus:outline-none text-base"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ditch-orange animate-spin" />}
            {query && !loading && (
              <button type="button" onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </form>
        </div>

        {/* Quick Tags */}
        {!searched && (
          <div className="mt-6 mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Hang 10 Marg", icon: "🍹" },
                { label: "Espresso Martini", icon: "☕" },
                { label: "Smoke on the Bay", icon: "🔥" },
                { label: "Mojito", icon: "🌿" },
                { label: "Old Fashioned", icon: "🥃" },
                { label: "Frozen Paloma", icon: "🧊" },
                { label: "No-Jito", icon: "🍃" },
                { label: "Margarita Mix", icon: "🧪" },
                { label: "Simple Syrup", icon: "🍯" },
                { label: "Falernum", icon: "⚗️" },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => setQuery(q.label)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-sm text-gray-400 hover:border-ditch-orange hover:text-ditch-orange transition-colors flex items-center gap-1.5"
                >
                  <span>{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recipe Card */}
        {searched && !loading && recipe && (
          <div className="mt-6 mb-8">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-ditch-navy to-ditch-navy/80 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-xl">{recipe.name}</h2>
                  {recipe.price && <span className="text-ditch-orange font-bold text-xl">{recipe.price}</span>}
                </div>
              </div>

              {recipe.allergyWarning && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">{recipe.allergyWarning}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-3 font-semibold text-gray-400 uppercase text-xs tracking-wider w-[150px]">Glass</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-400 uppercase text-xs tracking-wider">Ingredients</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-400 uppercase text-xs tracking-wider w-[180px]">Garnish</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-6 py-4 align-top border-r border-gray-800/50">
                        <p className="font-medium text-white">{recipe.glass || "—"}</p>
                        <div className="mt-3 pt-3 border-t border-gray-800/50">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Procedure</p>
                          <p className="text-gray-300 mt-1 text-sm">{recipe.procedure || "—"}</p>
                        </div>
                        {recipe.yield && (
                          <div className="mt-3 pt-3 border-t border-gray-800/50">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Yield</p>
                            <p className="text-gray-300 mt-1">{recipe.yield}</p>
                          </div>
                        )}
                        {recipe.shelfLife && (
                          <div className="mt-3 pt-3 border-t border-gray-800/50">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Shelf Life</p>
                            <p className="text-gray-300 mt-1">{recipe.shelfLife}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top border-r border-gray-800/50">
                        <div className="space-y-1.5">
                          {recipe.ingredients.map((ing, i) => (
                            <p key={i} className="text-gray-200">{ing}</p>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="text-gray-200">{recipe.garnish || "N/A"}</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {recipe.note && (
                <div className="px-6 py-3 border-t border-gray-800 bg-gray-900/50">
                  <p className="text-xs text-gray-500"><span className="font-semibold text-gray-400">Note:</span> {recipe.note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Answer */}
        {searched && !loading && !recipe && answer && (
          <div className="mt-6 mb-8">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ditch-orange/10 rounded-lg shrink-0">
                  <Sparkles className="w-5 h-5 text-ditch-orange" />
                </div>
                <div>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{answer.text}</p>
                  <p className="text-xs text-gray-600 mt-3">Source: {answer.source.section} → {answer.source.title}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module Results */}
        {searched && !loading && !recipe && results.length > 0 && (
          <div className="mt-4 mb-8 space-y-2">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={`/training/${result.sectionSlug}/${result.moduleSlug}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
              >
                <h3 className="font-medium text-white text-sm">{result.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.description}</p>
                <p className="text-xs text-ditch-orange mt-1">{result.sectionTitle}</p>
              </Link>
            ))}
          </div>
        )}

        {/* No results */}
        {searched && !loading && !recipe && !answer && results.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-500">No results found. Try a different search.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest">SpecOS by Ditch Hospitality</p>
          <p className="text-[10px] text-gray-700">Internal Use Only</p>
        </div>
      </footer>
    </div>
  );
}
