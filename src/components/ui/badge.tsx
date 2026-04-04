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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-red-100 text-red-700": variant === "required",
          "bg-gray-100 text-gray-500": variant === "optional",
          "bg-green-100 text-green-700": variant === "completed",
          "bg-red-100 text-red-700 animate-pulse": variant === "overdue",
          "bg-blue-100 text-blue-700": variant === "in-progress",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
