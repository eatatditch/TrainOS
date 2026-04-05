"use client";

import { useState } from "react";

interface TabBlockProps {
  tabs: { label: string; content: React.ReactNode }[];
}

export function TabBlock({ tabs }: TabBlockProps) {
  const [active, setActive] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="my-4">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active === index
                ? "text-ditch-orange border-b-2 border-ditch-orange"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5">{tabs[active].content}</div>
    </div>
  );
}
