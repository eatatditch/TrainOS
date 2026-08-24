import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="shell-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-ditch-sand/60">
        <Icon className="size-7 text-ditch-orange" />
      </div>
      <h3 className="mb-1 text-lg font-extrabold text-ditch-ink">{title}</h3>
      <p className="mb-4 max-w-sm text-sm leading-6 text-ditch-navy/60">{description}</p>
      {action}
    </div>
  );
}
