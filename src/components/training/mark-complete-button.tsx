"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

const REQUIRED_SECONDS = 300; // 5 minutes

export function MarkCompleteButton({ moduleId }: { moduleId: string }) {
  const [loading, setLoading] = useState(false);
  const [secondsOnPage, setSecondsOnPage] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const activeRef = useRef(true);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load accumulated time for this module from localStorage
    const storageKey = `module-active-time-${moduleId}`;
    const stored = parseInt(localStorage.getItem(storageKey) || "0");
    setSecondsOnPage(stored);
    if (stored >= REQUIRED_SECONDS) {
      setUnlocked(true);
      return;
    }

    // Track visibility — pause when tab is hidden or user navigates away
    const handleVisibility = () => {
      activeRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Tick every second, but only count if page is active/visible
    let accumulated = stored;
    tickRef.current = setInterval(() => {
      if (!activeRef.current) return;
      accumulated += 1;
      setSecondsOnPage(accumulated);
      localStorage.setItem(storageKey, accumulated.toString());
      if (accumulated >= REQUIRED_SECONDS) {
        setUnlocked(true);
        if (tickRef.current) clearInterval(tickRef.current);
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [moduleId]);

  const handleComplete = async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/modules/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (res.ok) {
        localStorage.removeItem(`module-active-time-${moduleId}`);
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, REQUIRED_SECONDS - secondsOnPage);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  if (!unlocked) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Review time remaining: <span className="font-mono font-medium text-gray-600">{minutes}:{seconds.toString().padStart(2, "0")}</span></span>
        </div>
        <Button disabled size="lg" className="flex items-center gap-2 opacity-50 cursor-not-allowed">
          <CheckCircle2 className="w-5 h-5" />
          Mark as Complete
        </Button>
        <p className="text-xs text-gray-400">Please review this module for at least 5 minutes</p>
      </div>
    );
  }

  return (
    <Button onClick={handleComplete} disabled={loading} size="lg" className="flex items-center gap-2">
      <CheckCircle2 className="w-5 h-5" />
      {loading ? "Marking Complete..." : "Mark as Complete"}
    </Button>
  );
}
