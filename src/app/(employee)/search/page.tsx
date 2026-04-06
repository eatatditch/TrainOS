"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, BookOpen, Loader2, Sparkles, ArrowRight, FileText, AlertTriangle } from "lucide-react";

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
  source: {
    title: string;
    section: string;
    sectionSlug: string;
    moduleSlug: string;
  };
}

interface Answer {
  text: string;
  source: { title: string; section: string; sectionSlug: string; moduleSlug: string };
  confidence: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setAnswer(null);
      setRecipe(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search/answer?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setRecipe(data.recipe);
        setResults(data.results || []);
      }
    } catch {
      // handle silently
    } finally {
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
        <p className="text-gray-500 mt-1">Ask anything about Ditch operations, recipes, or procedures</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "Hang 10 Marg" or "Espresso Martini" or "margarita mix recipe"...'
          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-ditch-orange focus:ring-0 focus:outline-none text-base"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Quick Questions */}
      {!searched && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Hang 10 Marg",
              "Smoke on the Bay",
              "Espresso Martini",
              "Mojito",
              "Holla Pain Yo",
              "Old Fashioned",
              "Frozen Paloma",
              "Margarita Mix",
              "No-Jito",
              "Falernum recipe",
              "Simple Syrup",
              "Big Al Burger",
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

      {/* Recipe Card — shown ALONE when a recipe matches */}
      {searched && !loading && recipe && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Recipe Header */}
            <div className="bg-ditch-navy px-5 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">{recipe.name}</h2>
                {recipe.price && (
                  <span className="text-ditch-orange font-bold text-lg">{recipe.price}</span>
                )}
              </div>
            </div>

            {/* Allergy Warning */}
            {recipe.allergyWarning && (
              <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">{recipe.allergyWarning}</span>
              </div>
            )}

            {/* Recipe Table */}
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

            {/* Note */}
            {recipe.note && (
              <div className="px-5 py-2 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500"><span className="font-semibold">Note:</span> {recipe.note}</p>
              </div>
            )}

            {/* Source */}
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
        </div>
      )}

      {/* Text Answer — for non-recipe questions */}
      {searched && !loading && !recipe && answer && (
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

      {/* Module Results — only shown when NO recipe match */}
      {searched && !loading && !recipe && results.length > 0 && (
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
                      <p className="text-xs text-ditch-orange mt-1">{result.sectionTitle}</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && !recipe && !answer && results.length === 0 && (
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
    </div>
  );
}
