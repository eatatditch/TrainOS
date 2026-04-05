interface SectionBlockProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SectionBlock({ title, subtitle, children }: SectionBlockProps) {
  return (
    <section className="mb-8 border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
      <h2 className="text-2xl font-bold text-ditch-navy mb-2">{title}</h2>
      {subtitle && (
        <p className="text-gray-500 text-sm mb-4">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
