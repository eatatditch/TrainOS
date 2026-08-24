import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const errorId = `${fieldId}-error`;
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={fieldId} className="field-label block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          className={cn(
            "min-h-11 w-full rounded-xl border border-ditch-navy/15 bg-white px-4 py-2.5 text-sm text-ditch-ink shadow-sm transition-all placeholder:text-ditch-navy/35 focus:border-ditch-orange focus:shadow-[0_0_0_3px_rgba(216,95,42,0.1)]",
            error && "border-red-500 focus:ring-red-500/50 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
