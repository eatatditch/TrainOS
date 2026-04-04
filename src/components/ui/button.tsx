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
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-ditch-orange text-white hover:bg-ditch-orange/90 focus:ring-ditch-orange/50": variant === "primary",
            "bg-ditch-navy text-white hover:bg-ditch-navy/90 focus:ring-ditch-navy/50": variant === "secondary",
            "border-2 border-ditch-navy text-ditch-navy hover:bg-ditch-navy hover:text-white focus:ring-ditch-navy/50": variant === "outline",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-200": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50": variant === "danger",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
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
