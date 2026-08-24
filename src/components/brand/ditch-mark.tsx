import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface DitchMarkProps {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
  product?: "TrainOS" | "SpecOS" | "Control";
}

export function DitchMark({
  compact = false,
  inverse = false,
  className,
  product = "TrainOS",
}: DitchMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label={`Ditch ${product}`}>
      <span
        className={cn(
          "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-ditch-orange text-white shadow-[0_8px_24px_rgba(205,96,40,0.28)]",
          compact && "size-9 rounded-xl"
        )}
        aria-hidden="true"
      >
        <Waves className={cn("size-6", compact && "size-5")} strokeWidth={2.4} />
        <span className="absolute inset-x-0 bottom-0 h-1 bg-ditch-sand/90" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              "block text-[15px] font-black uppercase tracking-[0.18em]",
              inverse ? "text-white" : "text-ditch-ink"
            )}
          >
            Ditch
          </span>
          <span
            className={cn(
              "mt-1 block text-[10px] font-bold uppercase tracking-[0.24em]",
              inverse ? "text-white/55" : "text-ditch-navy/55"
            )}
          >
            {product}
          </span>
        </span>
      )}
    </div>
  );
}
