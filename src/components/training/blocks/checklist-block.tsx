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
    <div className="my-4">
      {title && <p className="font-bold text-gray-900 mb-3">{title}</p>}
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700">
            {style === "check" && (
              <Check
                className="text-ditch-green mt-0.5 shrink-0"
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
