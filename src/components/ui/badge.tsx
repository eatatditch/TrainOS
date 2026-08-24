import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "required" | "optional" | "completed" | "overdue" | "in-progress";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]",
        {
          "border-ditch-navy/10 bg-ditch-navy/[0.06] text-ditch-navy/75": variant === "default",
          "border-red-200 bg-red-50 text-red-700": variant === "required",
          "border-ditch-navy/10 bg-ditch-sand/30 text-ditch-navy/55": variant === "optional",
          "border-ditch-green/20 bg-ditch-seafoam/25 text-ditch-green": variant === "completed",
          "border-red-300 bg-red-50 text-red-700": variant === "overdue",
          "border-ditch-orange/20 bg-ditch-orange/[0.08] text-ditch-orange": variant === "in-progress",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
