import { Star } from "lucide-react";

interface KeyTakeawayProps {
  items: string[];
  title?: string;
}

export function KeyTakeaway({
  items,
  title = "Key Takeaways",
}: KeyTakeawayProps) {
  return (
    <div className="rounded-xl border-l-4 border-l-ditch-green bg-green-50 p-5 my-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Star className="text-ditch-green shrink-0" size={20} />
        <p className="font-bold text-ditch-green">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-2.5 text-sm text-gray-800"
          >
            <span className="text-ditch-green mt-1 shrink-0">&bull;</span>
            <span className="font-medium">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
