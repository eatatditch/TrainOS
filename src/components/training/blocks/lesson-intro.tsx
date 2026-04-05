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
    <div className="rounded-xl bg-gradient-to-br from-ditch-navy to-ditch-navy/90 text-white p-6 md:p-8 my-4 shadow-sm">
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

      <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
      {subtitle && (
        <p className="text-white/80 text-base md:text-lg mb-4">{subtitle}</p>
      )}

      {whyItMatters && (
        <div className="mt-4 rounded-lg bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
            Why It Matters
          </p>
          <p className="text-white/90 text-sm italic leading-relaxed">
            {whyItMatters}
          </p>
        </div>
      )}
    </div>
  );
}
