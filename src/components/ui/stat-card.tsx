import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-ditch-navy/10 bg-white/95 p-4 shadow-[var(--shadow-surf)] sm:p-5", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ditch-navy/50">{title}</p>
          <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-ditch-ink sm:text-3xl">{value}</p>
          {description && <p className="mt-1 text-xs text-ditch-navy/50">{description}</p>}
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-ditch-sand/55">
          <Icon className="size-5 text-ditch-orange" />
        </div>
      </div>
    </div>
  );
}
