interface SectionBlockProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SectionBlock({ title, subtitle, children }: SectionBlockProps) {
  return (
    <section className="mb-10 border-b border-ditch-navy/10 pb-10 last:border-b-0 last:pb-0">
      <h2 className="mb-2 text-2xl font-black tracking-[-0.035em] text-ditch-ink">{title}</h2>
      {subtitle && (
        <p className="mb-4 text-sm leading-6 text-ditch-navy/55">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
