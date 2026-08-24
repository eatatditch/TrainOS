"use client";

import { AlertTriangle, CheckCircle2, Leaf } from "lucide-react";

export interface Recipe {
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
  trainingStatus: string;
  locked: boolean;
  source: { title: string; section: string; sectionSlug: string; moduleSlug: string };
}

export interface FoodItem {
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
  linkedIngredients?: { id: string; name: string; allergens: string[]; notes: string }[];
  verdict?: { safe: boolean; text: string } | null;
}

export interface FoodList {
  label: string;
  items: FoodItem[];
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-ditch-navy/10 bg-white shadow-[var(--shadow-lift)]">
      <div className="bg-gradient-to-r from-ditch-navy to-ditch-ink px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{recipe.name}</h2>
          {recipe.price && <span className="text-xl font-black text-ditch-seafoam">{recipe.price}</span>}
        </div>
      </div>
      {recipe.allergyWarning && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">{recipe.allergyWarning}</span>
        </div>
      )}
      {recipe.locked && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-4" role="alert">
          <p className="flex items-center gap-2 text-sm font-extrabold text-red-800">
            <AlertTriangle className="size-4 shrink-0" /> Recipe locked — do not train or build from this record
          </p>
          <p className="mt-1 text-xs leading-5 text-red-700">{recipe.trainingStatus}. Ask a manager for the current approved recipe lock.</p>
        </div>
      )}
      {!recipe.locked && <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider w-[150px]">Glass</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Ingredients</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider w-[180px]">Garnish</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-6 py-4 align-top border-r border-gray-100">
                <p className="font-medium text-gray-900">{recipe.glass || "—"}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Procedure</p>
                  <p className="text-gray-700 mt-1 text-sm">{recipe.procedure || "—"}</p>
                </div>
                {recipe.yield && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Yield</p>
                    <p className="text-gray-700 mt-1">{recipe.yield}</p>
                  </div>
                )}
                {recipe.shelfLife && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Shelf Life</p>
                    <p className="text-gray-700 mt-1">{recipe.shelfLife}</p>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 align-top border-r border-gray-100">
                <div className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (<p key={i} className="text-gray-800">{ing}</p>))}
                </div>
              </td>
              <td className="px-6 py-4 align-top"><p className="text-gray-800">{recipe.garnish || "N/A"}</p></td>
            </tr>
          </tbody>
        </table>
      </div>}
      {recipe.note && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Note:</span> {recipe.note}</p>
        </div>
      )}
    </div>
  );
}

export function FoodItemCard({ foodItem }: { foodItem: FoodItem }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-ditch-navy/10 bg-white shadow-[var(--shadow-lift)]">
      <div className="bg-gradient-to-r from-ditch-navy to-ditch-ink px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-ditch-orange text-xs uppercase tracking-widest font-semibold">{foodItem.category}</p>
            <h2 className="mt-0.5 text-xl font-black tracking-tight text-white sm:text-2xl">{foodItem.name}</h2>
            {foodItem.badge && <p className="text-gray-300 text-xs mt-0.5">{foodItem.badge}</p>}
          </div>
          {foodItem.price && <span className="text-xl font-black text-ditch-seafoam">{foodItem.price}</span>}
        </div>
      </div>
      {foodItem.verdict && (
        <div className={`px-6 py-3 flex items-start gap-2 border-b ${foodItem.verdict.safe ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          {foodItem.verdict.safe ? <CheckCircle2 className="w-4 h-4 text-ditch-green shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
          <span className={`text-sm font-medium ${foodItem.verdict.safe ? "text-green-700" : "text-red-700"}`}>{foodItem.verdict.text}</span>
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
              {foodItem.allergens.map((a) => (<span key={a} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium capitalize">{a}</span>))}
            </div>
          </div>
        )}
        {foodItem.dietary.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Dietary</p>
            <div className="flex flex-wrap gap-2">
              {foodItem.dietary.map((d) => (<span key={d} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium capitalize">{d.replace(/-/g, " ")}</span>))}
            </div>
          </div>
        )}
        {foodItem.crossWarnings && foodItem.crossWarnings.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Cross-contamination</p>
            <ul className="space-y-1">{foodItem.crossWarnings.map((w, i) => (<li key={i} className="text-red-700 text-xs">• {w}</li>))}</ul>
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
  );
}

export function FoodListCard({ foodList, onItemClick }: { foodList: FoodList; onItemClick: (name: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-ditch-green" />
        <h2 className="text-gray-900 font-bold text-lg capitalize">{foodList.label}</h2>
        <span className="text-gray-500 text-sm">({foodList.items.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {foodList.items.map((item) => (
          <button type="button" key={item.name} onClick={() => onItemClick(item.name)} className="rounded-2xl border border-ditch-navy/10 bg-white p-4 text-left shadow-[var(--shadow-surf)] transition-all hover:-translate-y-0.5 hover:border-ditch-orange/35 hover:shadow-[var(--shadow-lift)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{item.category}</p>
                <h3 className="font-medium text-gray-900 text-sm mt-0.5">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
              </div>
              {item.price && <span className="text-ditch-orange font-bold text-sm shrink-0">{item.price}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
