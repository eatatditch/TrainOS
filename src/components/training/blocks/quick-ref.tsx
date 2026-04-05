import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Bookmark,
} from "lucide-react";

interface QuickRefProps {
  type: "do" | "dont" | "escalate" | "language" | "mistakes" | "remember";
  title?: string;
  items: string[];
}

const config = {
  do: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-l-green-500",
    defaultTitle: "What Good Looks Like",
  },
  dont: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-l-red-500",
    defaultTitle: "Common Mistakes",
  },
  escalate: {
    icon: AlertTriangle,
    color: "text-ditch-orange",
    bg: "bg-orange-50",
    border: "border-l-ditch-orange",
    defaultTitle: "Manager Escalation",
  },
  language: {
    icon: MessageSquare,
    color: "text-ditch-navy",
    bg: "bg-blue-50",
    border: "border-l-ditch-navy",
    defaultTitle: "Guest-Facing Language",
  },
  mistakes: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-l-red-500",
    defaultTitle: "Common Mistakes",
  },
  remember: {
    icon: Bookmark,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-l-blue-500",
    defaultTitle: "Remember This",
  },
} as const;

export function QuickRef({ type, title, items }: QuickRefProps) {
  const { icon: Icon, color, bg, border, defaultTitle } = config[type];

  return (
    <div
      className={`rounded-xl ${bg} border-l-4 ${border} p-5 my-4 shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`${color} shrink-0`} size={20} />
        <p className={`font-bold ${color}`}>{title ?? defaultTitle}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-2.5 text-sm text-gray-700"
          >
            <Icon className={`${color} mt-0.5 shrink-0`} size={14} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
