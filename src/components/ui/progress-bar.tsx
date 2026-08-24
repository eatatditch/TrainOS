import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, size = "md", showLabel = true, className }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(Math.max(Math.round((value / max) * 100), 0), 100) : 0;
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-ditch-navy/65">{percentage}% Complete</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-ditch-navy/10", {
        "h-1.5": size === "sm",
        "h-2.5": size === "md",
        "h-4": size === "lg",
      })}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            "bg-ditch-orange/80": percentage < 25,
            "bg-ditch-orange": percentage >= 25 && percentage < 75,
            "bg-ditch-green": percentage >= 75,
          })}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
