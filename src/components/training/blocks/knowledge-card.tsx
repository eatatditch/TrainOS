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
      className={`rounded-xl bg-white border border-gray-200 p-5 shadow-sm ${
        highlight ? "border-l-4 border-l-ditch-orange" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
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

      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

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
