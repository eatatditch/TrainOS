"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

const REQUIRED_SECONDS = 300; // 5 minutes

interface MarkCompleteButtonProps {
  moduleId: string;
  reviewToken: string;
  /** Unix timestamp in seconds, signed into reviewToken by the server. */
  eligibleAt: number;
  /** When true, the 5-minute review timer is skipped for this user. */
  skipReviewTimer?: boolean;
  completionLabel?: string;
}

export function MarkCompleteButton({
  moduleId,
  reviewToken,
  eligibleAt,
  skipReviewTimer = false,
  completionLabel = "Mark as complete",
}: MarkCompleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(
    skipReviewTimer ? 0 : REQUIRED_SECONDS,
  );
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (skipReviewTimer) return;

    const updateRemaining = () => {
      const now = Math.floor(Date.now() / 1_000);
      setRemaining(Math.max(0, eligibleAt - now));
    };
    const firstUpdate = window.setTimeout(updateRemaining, 0);
    const interval = window.setInterval(updateRemaining, 1_000);

    return () => {
      window.clearTimeout(firstUpdate);
      window.clearInterval(interval);
    };
  }, [eligibleAt, skipReviewTimer]);

  const unlocked = remaining === 0;

  const handleComplete = async () => {
    if (!unlocked) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/modules/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, reviewToken }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "We could not save this completion. Try again.");
      }
    } catch {
      setError("You appear to be offline. Reconnect and try again.");
    } finally {
      setLoading(false);
    }
  };

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
          {completionLabel}
        </Button>
        <p className="text-xs text-gray-400">Please review this module for at least 5 minutes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleComplete} disabled={loading} size="lg" className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" />
        {loading ? "Saving…" : completionLabel}
      </Button>
      {error ? <p className="max-w-sm text-right text-sm font-medium text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
