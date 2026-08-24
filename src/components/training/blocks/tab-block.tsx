"use client";

import { useId, useRef, useState } from "react";

interface TabBlockProps {
  tabs: { label: string; content: React.ReactNode }[];
}

export function TabBlock({ tabs }: TabBlockProps) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (tabs.length === 0) return null;

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-ditch-navy/10 bg-white shadow-[var(--shadow-surf)]">
      <div className="flex overflow-x-auto border-b border-ditch-navy/10 bg-ditch-navy/[0.03]" role="tablist">
        {tabs.map((tab, index) => (
          <button
            type="button"
            key={`${tab.label}-${index}`}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tabs.length - 1;
              else return;
              event.preventDefault();
              setActive(next);
              tabRefs.current[next]?.focus();
            }}
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-controls={`${baseId}-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              active === index
                ? "border-ditch-orange bg-white text-ditch-orange"
                : "border-transparent text-ditch-navy/50 hover:text-ditch-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="p-5"
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
      >
        {tabs[active].content}
      </div>
    </div>
  );
}
