"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionBlockProps {
  items: { title: string; content: React.ReactNode }[];
  defaultOpen?: number;
}

export function AccordionBlock({ items, defaultOpen }: AccordionBlockProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpen ?? null
  );

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="my-5 divide-y divide-ditch-navy/10 overflow-hidden rounded-2xl border border-ditch-navy/10 bg-white shadow-[var(--shadow-surf)]">
      {items.map((item, index) => (
        <div key={index}>
          <button
            type="button"
            onClick={() => toggle(index)}
            aria-expanded={openIndex === index}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-ditch-sand/20"
          >
            <span className="text-sm font-bold text-ditch-ink">
              {item.title}
            </span>
            <ChevronDown
              size={18}
              className={`ml-2 shrink-0 text-ditch-navy/40 transition-transform duration-200 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-5 pb-5 text-sm leading-7 text-ditch-navy/70">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
