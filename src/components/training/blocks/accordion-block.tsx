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
    <div className="my-4 divide-y divide-gray-200 border-y border-gray-200 rounded-xl overflow-hidden">
      {items.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => toggle(index)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 text-sm">
              {item.title}
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
