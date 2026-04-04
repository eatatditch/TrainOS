"use client";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  size?: "md" | "lg";
}

export function SearchInput({ placeholder = "Search...", onSearch, className, size = "md" }: SearchInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", {
        "w-4 h-4": size === "md",
        "w-5 h-5": size === "lg",
      })} />
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); onSearch(e.target.value); }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-ditch-orange/50 focus:border-ditch-orange transition-colors",
          {
            "pl-10 pr-10 py-2.5 text-sm": size === "md",
            "pl-12 pr-12 py-4 text-base": size === "lg",
          }
        )}
      />
      {value && (
        <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </form>
  );
}
