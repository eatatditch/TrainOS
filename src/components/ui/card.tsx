import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ditch-navy/10 bg-white/95 p-5 shadow-[var(--shadow-surf)] sm:p-6",
        hover && "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-ditch-orange/25 hover:shadow-[var(--shadow-lift)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-extrabold tracking-[-0.025em] text-ditch-ink", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-sm leading-6 text-ditch-navy/60", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("", className)}>{children}</div>;
}
