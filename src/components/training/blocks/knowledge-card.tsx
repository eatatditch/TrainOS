interface KnowledgeCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  description: string;
  details?: string[];
  highlight?: boolean;
}

export function KnowledgeCard({
  title,
  subtitle,
  badge,
  price,
  description,
  details,
  highlight = false,
}: KnowledgeCardProps) {
  return (
    <div
      className={`rounded-2xl border border-ditch-navy/10 bg-white p-5 shadow-[var(--shadow-surf)] ${
        highlight ? "border-l-4 border-l-ditch-orange" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-extrabold tracking-tight text-ditch-ink">{title}</h3>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
        {price && (
          <span className="text-ditch-orange font-semibold whitespace-nowrap">
            {price}
          </span>
        )}
      </div>

      {badge && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {badge.split(",").map((b) => (
            <span
              key={b.trim()}
              className="inline-block rounded-full bg-ditch-navy/10 text-ditch-navy text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5"
            >
              {b.trim()}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm leading-6 text-ditch-navy/70">{description}</p>

      {details && details.length > 0 && (
        <ul className="mt-3 space-y-1">
          {details.map((detail, i) => (
            <li
              key={i}
              className="text-sm text-gray-500 flex items-start gap-2"
            >
              <span className="text-ditch-orange mt-1 shrink-0">&bull;</span>
              {detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
