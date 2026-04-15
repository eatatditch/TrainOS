"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface PalomaManProps {
  /** A short message in his speech bubble. If omitted, a random tip is used. */
  message?: string;
  /** Visual size: sm | md | lg. Default md. */
  size?: "sm" | "md" | "lg";
  /** Where to anchor him on the page. */
  position?: "inline" | "bottom-right" | "bottom-left" | "top-right";
  /** Auto-dismiss after N seconds. 0 = never. Default 0. */
  autoDismiss?: number;
  /** Localstorage key — if set, hides Paloma forever after the user dismisses him. */
  dismissKey?: string;
  /** Show speech bubble. Default true. */
  speech?: boolean;
}

const TIPS = [
  "Always confirm allergens with the kitchen before serving.",
  "Tap the Allergen Key at the bottom if a guest asks about gluten-free vs gluten-friendly.",
  "Daily 86'd items? Check with the manager before each shift.",
  "When in doubt, search SpecOS — instant answers, every spec.",
  "Greet every guest within 30 seconds of seating.",
  "Wing sauce options change — ask the kitchen daily.",
  "Cocktail garnishes matter. Presentation = perception.",
  "Suggest the Hang 10 Combo to groups — it's the best value starter.",
  "Lobster Roll: confirm hot vs cold with the guest.",
  "Tres leches contains dairy. Always.",
  "Smile. The guest can hear it through the headset, the host stand, and the table.",
  "Refill water before they ask.",
  "Got a celiac guest? Skip anything with 'gluten-friendly' — that's not the same as gluten-free.",
];

const SIZE_MAP = {
  sm: { img: 56, bubble: "max-w-[180px] text-xs" },
  md: { img: 88, bubble: "max-w-[220px] text-sm" },
  lg: { img: 128, bubble: "max-w-[260px] text-sm" },
};

export function PalomaMan({
  message,
  size = "md",
  position = "inline",
  autoDismiss = 0,
  dismissKey,
  speech = true,
}: PalomaManProps) {
  const [dismissed, setDismissed] = useState(false);
  const [tip, setTip] = useState<string>(message || TIPS[0]);

  useEffect(() => {
    if (dismissKey && typeof window !== "undefined") {
      if (localStorage.getItem(`paloma-${dismissKey}`)) setDismissed(true);
    }
    if (!message) {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }
  }, [dismissKey, message]);

  useEffect(() => {
    if (autoDismiss > 0) {
      const t = setTimeout(() => setDismissed(true), autoDismiss * 1000);
      return () => clearTimeout(t);
    }
  }, [autoDismiss]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissKey && typeof window !== "undefined") {
      localStorage.setItem(`paloma-${dismissKey}`, "1");
    }
  };

  const positionClass =
    position === "bottom-right"
      ? "fixed bottom-4 right-4 z-30"
      : position === "bottom-left"
      ? "fixed bottom-4 left-4 z-30"
      : position === "top-right"
      ? "fixed top-20 right-4 z-30"
      : "relative";

  const { img, bubble } = SIZE_MAP[size];

  return (
    <div className={`${positionClass} flex items-end gap-2 animate-fade-in`}>
      {speech && (
        <div className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2 ${bubble}`}>
          <p className="text-gray-800 leading-snug pr-3">{tip}</p>
          <button
            onClick={handleDismiss}
            className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
          {/* Tail */}
          <div
            className="absolute bottom-3 -right-2 w-0 h-0"
            style={{
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: "8px solid white",
            }}
          />
        </div>
      )}
      <img
        src="/api/mascot/paloma"
        alt="Paloma Man"
        width={img}
        height={img}
        className="select-none drop-shadow-md"
        style={{ width: img, height: img, objectFit: "contain" }}
      />
    </div>
  );
}
