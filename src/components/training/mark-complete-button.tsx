"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function MarkCompleteButton({ moduleId }: { moduleId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modules/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleComplete} disabled={loading} size="lg" className="flex items-center gap-2">
      <CheckCircle2 className="w-5 h-5" />
      {loading ? "Marking Complete..." : "Mark as Complete"}
    </Button>
  );
}
