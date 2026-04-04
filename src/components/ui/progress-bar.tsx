import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, size = "md", showLabel = true, className }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{percentage}% Complete</span>
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", {
        "h-1.5": size === "sm",
        "h-2.5": size === "md",
        "h-4": size === "lg",
      })}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            "bg-red-500": percentage < 25,
            "bg-ditch-orange": percentage >= 25 && percentage < 75,
            "bg-ditch-green": percentage >= 75,
          })}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
