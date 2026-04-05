interface CardGridProps {
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
} as const;

export function CardGrid({ columns = 2, children }: CardGridProps) {
  return (
    <div className={`grid ${columnClasses[columns]} gap-4 my-4`}>
      {children}
    </div>
  );
}
