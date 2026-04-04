"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, BookOpen, FileText, ClipboardCheck, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  type: "module" | "section" | "quiz";
  title: string;
  description: string;
  sectionTitle: string;
  sectionSlug: string;
  moduleSlug: string;
  tags: string[];
  matchContext?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const filteredResults = results;

  const typeIcon = (type: string) => {
    switch (type) {
      case "module": return <BookOpen className="w-5 h-5 text-ditch-orange" />;
      case "section": return <FileText className="w-5 h-5 text-ditch-navy" />;
      case "quiz": return <ClipboardCheck className="w-5 h-5 text-ditch-green" />;
      default: return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Search & Knowledge Center</h1>
        <p className="text-gray-500 mt-1">Search across all Ditch training content</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "how do I close the bar?" or "hang 10 marg" or "allergy guest"...'
          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-ditch-orange focus:ring-0 focus:outline-none text-base"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "module", label: "Modules" },
          { value: "section", label: "Sections" },
          { value: "quiz", label: "Quizzes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-ditch-orange text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quick Questions */}
      {!searched && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Common questions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "How do I close the bar?",
              "What comes on the Big Al?",
              "Hang 10 marg recipe",
              "Allergy guest protocol",
              "Server side work",
              "Opening checklist",
              "POS cashout steps",
              "Taco knowledge",
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

      {/* Results */}
      {searched && !loading && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} found
          </p>
          {filteredResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No Results Found"
              description="Try different keywords or check the spelling. You can also browse the Training Library directly."
              action={
                <Link href="/training" className="text-ditch-orange hover:underline text-sm">
                  Browse Training Library
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={
                    result.type === "section"
                      ? `/training/${result.sectionSlug}`
                      : result.type === "quiz"
                      ? `/quizzes/${result.id}`
                      : `/training/${result.sectionSlug}/${result.moduleSlug}`
                  }
                >
                  <Card hover className="flex items-start gap-4">
                    <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                      {typeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{result.title}</h3>
                        <Badge>{result.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{result.description}</p>
                      {result.sectionTitle && (
                        <p className="text-xs text-ditch-orange mt-1">{result.sectionTitle}</p>
                      )}
                      {result.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
