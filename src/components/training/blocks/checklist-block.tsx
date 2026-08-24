import { Check } from "lucide-react";

interface ChecklistBlockProps {
  title?: string;
  items: string[];
  style?: "check" | "bullet" | "number";
}

export function ChecklistBlock({
  title,
  items,
  style = "check",
}: ChecklistBlockProps) {
  return (
    <div className="my-5">
      {title && <p className="mb-3 font-extrabold text-ditch-ink">{title}</p>}
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-sm leading-6 text-ditch-navy/75">
            {style === "check" && (
              <Check
                className="mt-0.5 shrink-0 rounded-full bg-ditch-seafoam/35 p-0.5 text-ditch-green"
                size={18}
              />
            )}
            {style === "bullet" && (
              <span className="text-ditch-green mt-1 shrink-0 text-lg leading-none">
                &bull;
              </span>
            )}
            {style === "number" && (
              <span className="text-ditch-orange font-semibold shrink-0 min-w-[1.25rem]">
                {index + 1}.
              </span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
