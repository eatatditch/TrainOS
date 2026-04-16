"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Surfing for the best answer...",
  "Catching a wave through the menu...",
  "Paddling out to check the allergens...",
  "Reading the lineup for the perfect recommendation...",
  "Checking the kitchen forecast...",
  "Hang 10 — almost there...",
  "Dialing in the specs...",
  "Cross-referencing every recipe...",
];

interface SurfingLoaderProps {
  /** Dark-themed (for SpecOS on a dark background). Default false. */
  dark?: boolean;
  /** Optional override message instead of rotating tips. */
  message?: string;
}

export function SurfingLoader({ dark = false, message }: SurfingLoaderProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 1800);
    return () => clearInterval(id);
  }, [message]);

  const currentTip = message || TIPS[tipIndex];

  const cardCls = dark
    ? "bg-white/5 border-white/10"
    : "bg-gradient-to-br from-sky-50 via-white to-orange-50 border-ditch-orange/20";
  const textCls = dark ? "text-white" : "text-gray-800";
  const subCls = dark ? "text-white/60" : "text-gray-500";

  return (
    <div className={`rounded-2xl border ${cardCls} p-6 overflow-hidden`}>
      <div className="relative h-28 sm:h-32 w-full">
        {/* Sky / sun */}
        <div className="absolute inset-0 flex items-start justify-end pr-6 pt-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-80 blur-[1px]" />
        </div>

        {/* Wave layers */}
        <svg
          className="absolute bottom-0 left-0 w-full h-20"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 50 Q 50 30 100 50 T 200 50 T 300 50 T 400 50 V80 H0 Z"
            fill={dark ? "#325269" : "#325269"}
            opacity="0.85"
          >
            <animate
              attributeName="d"
              dur="3s"
              repeatCount="indefinite"
              values="
                M0 50 Q 50 30 100 50 T 200 50 T 300 50 T 400 50 V80 H0 Z;
                M0 50 Q 50 60 100 40 T 200 55 T 300 45 T 400 50 V80 H0 Z;
                M0 50 Q 50 30 100 50 T 200 50 T 300 50 T 400 50 V80 H0 Z
              "
            />
          </path>
          <path
            d="M0 60 Q 60 45 120 60 T 240 60 T 360 60 T 400 60 V80 H0 Z"
            fill={dark ? "#1e3a52" : "#5ba7d4"}
            opacity="0.7"
          >
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values="
                M0 60 Q 60 45 120 60 T 240 60 T 360 60 T 400 60 V80 H0 Z;
                M0 60 Q 60 70 120 50 T 240 65 T 360 55 T 400 60 V80 H0 Z;
                M0 60 Q 60 45 120 60 T 240 60 T 360 60 T 400 60 V80 H0 Z
              "
            />
          </path>
        </svg>

        {/* Paloma Man — surfs left to right, bobbing on the wave */}
        <div className="absolute bottom-4 left-0 w-full pointer-events-none">
          <div className="surfer-track relative inline-block">
            {/* Surfboard under his feet */}
            <svg
              width="96"
              height="18"
              viewBox="0 0 96 18"
              className="absolute left-1/2 -translate-x-1/2 bottom-0 drop-shadow-md"
              aria-hidden
            >
              <ellipse cx="48" cy="10" rx="44" ry="7" fill="#cd6028" stroke="#a44a1e" strokeWidth="1.5" />
              <ellipse cx="48" cy="8" rx="38" ry="3" fill="#fff" opacity="0.45" />
              <circle cx="48" cy="10" r="1.5" fill="#a44a1e" />
            </svg>
            {/* Paloma Man riding the board */}
            <img
              src="/api/mascot/paloma?v=2"
              alt=""
              width={72}
              height={72}
              className="relative block drop-shadow-lg"
              style={{ width: 72, height: 72, objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      {/* Rotating tip */}
      <div className="mt-4 text-center">
        <p className={`text-sm sm:text-base font-medium ${textCls} transition-opacity`}>
          {currentTip}
        </p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-ditch-orange animate-bounce`} style={{ animationDelay: "0ms" }} />
          <span className={`w-1.5 h-1.5 rounded-full bg-ditch-orange animate-bounce`} style={{ animationDelay: "150ms" }} />
          <span className={`w-1.5 h-1.5 rounded-full bg-ditch-orange animate-bounce`} style={{ animationDelay: "300ms" }} />
        </div>
        <p className={`text-[10px] uppercase tracking-wider mt-2 ${subCls}`}>
          AI is thinking
        </p>
      </div>

      <style jsx>{`
        .surfer-track {
          animation: surf-x 3.5s ease-in-out infinite;
          display: inline-block;
          transform-origin: bottom center;
        }
        @keyframes surf-x {
          0% {
            transform: translateX(-10%) translateY(0) rotate(-4deg);
          }
          25% {
            transform: translateX(25%) translateY(-4px) rotate(2deg);
          }
          50% {
            transform: translateX(55%) translateY(0) rotate(-2deg);
          }
          75% {
            transform: translateX(80%) translateY(-4px) rotate(3deg);
          }
          100% {
            transform: translateX(-10%) translateY(0) rotate(-4deg);
          }
        }
      `}</style>
    </div>
  );
}
