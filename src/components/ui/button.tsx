"use client";
import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl font-bold shadow-sm transition-all disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-ditch-orange text-white hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md": variant === "primary",
            "bg-ditch-navy text-white hover:-translate-y-0.5 hover:bg-ditch-ink hover:shadow-md": variant === "secondary",
            "border border-ditch-navy/25 bg-white text-ditch-navy hover:-translate-y-0.5 hover:border-ditch-navy hover:bg-ditch-navy hover:text-white": variant === "outline",
            "bg-transparent text-ditch-navy/70 shadow-none hover:bg-ditch-navy/[0.06] hover:text-ditch-ink": variant === "ghost",
            "bg-red-600 text-white hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md": variant === "danger",
          },
          {
            "px-3.5 py-2 text-xs": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "min-h-12 px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export { Button };
