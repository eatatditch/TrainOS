import { Clock } from "lucide-react";

interface LessonIntroProps {
  title: string;
  subtitle?: string;
  whyItMatters?: string;
  estimatedTime?: number;
  tags?: string[];
}

export function LessonIntro({
  title,
  subtitle,
  whyItMatters,
  estimatedTime,
  tags,
}: LessonIntroProps) {
  return (
    <div className="relative my-6 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-ditch-navy to-ditch-ink p-6 text-white shadow-[var(--shadow-lift)] md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full border-[48px] border-ditch-seafoam/[0.06]" />
      <div className="relative">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {estimatedTime && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Clock size={14} />
            {estimatedTime} min
          </span>
        )}
        {tags?.map((tag) => (
          <span
            key={tag}
            className="inline-block rounded-full bg-ditch-orange/80 px-3 py-1 text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <h2 className="mb-2 text-2xl font-black tracking-[-0.04em] md:text-3xl">{title}</h2>
      {subtitle && (
        <p className="text-white/80 text-base md:text-lg mb-4">{subtitle}</p>
      )}

      {whyItMatters && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
            Why It Matters
          </p>
          <p className="text-white/90 text-sm italic leading-relaxed">
            {whyItMatters}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
