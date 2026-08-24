import { cn } from "@/lib/utils";
import { forwardRef, TextareaHTMLAttributes, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const errorId = `${fieldId}-error`;
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={fieldId} className="field-label block">{label}</label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          className={cn(
            "min-h-[120px] w-full rounded-xl border border-ditch-navy/15 bg-white px-4 py-3 text-sm text-ditch-ink shadow-sm transition-all placeholder:text-ditch-navy/35 focus:border-ditch-orange focus:shadow-[0_0_0_3px_rgba(216,95,42,0.1)]",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
export { Textarea };
