import { cn } from "@/lib/utils";
import { forwardRef, SelectHTMLAttributes, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, "aria-describedby": describedBy, ...props }, ref) => {
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
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          className={cn(
            "min-h-11 w-full rounded-xl border border-ditch-navy/15 bg-white px-4 py-2.5 text-sm text-ditch-ink shadow-sm transition-all focus:border-ditch-orange focus:shadow-[0_0_0_3px_rgba(216,95,42,0.1)]",
            error && "border-red-500",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p id={errorId} className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
export { Select };
