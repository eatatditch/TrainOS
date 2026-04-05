import {
  AlertTriangle,
  Star,
  Lightbulb,
  Shield,
  BookOpen,
} from "lucide-react";

interface CalloutBlockProps {
  type: "warning" | "important" | "tip" | "standard" | "remember";
  title?: string;
  children: React.ReactNode;
}

const config = {
  warning: {
    icon: AlertTriangle,
    border: "border-l-red-500",
    bg: "bg-red-50",
    iconColor: "text-red-500",
    defaultTitle: "Warning",
  },
  important: {
    icon: Star,
    border: "border-l-ditch-orange",
    bg: "bg-orange-50",
    iconColor: "text-ditch-orange",
    defaultTitle: "Important",
  },
  tip: {
    icon: Lightbulb,
    border: "border-l-ditch-green",
    bg: "bg-green-50",
    iconColor: "text-ditch-green",
    defaultTitle: "Tip",
  },
  standard: {
    icon: Shield,
    border: "border-l-ditch-navy",
    bg: "bg-blue-50",
    iconColor: "text-ditch-navy",
    defaultTitle: "Standard",
  },
  remember: {
    icon: BookOpen,
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    defaultTitle: "Remember",
  },
} as const;

export function CalloutBlock({ type, title, children }: CalloutBlockProps) {
  const { icon: Icon, border, bg, iconColor, defaultTitle } = config[type];

  return (
    <div
      className={`rounded-xl ${bg} border-l-4 ${border} p-5 my-4 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${iconColor} mt-0.5 shrink-0`} size={20} />
        <div className="min-w-0">
          <p className={`font-semibold ${iconColor} mb-1`}>
            {title ?? defaultTitle}
          </p>
          <div className="text-gray-700 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
