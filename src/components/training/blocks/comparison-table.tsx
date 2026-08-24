interface ComparisonTableProps {
  headers: string[];
  rows: string[][];
}

export function ComparisonTable({ headers, rows }: ComparisonTableProps) {
  return (
    <div className="data-table my-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ditch-navy/[0.04]">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-5 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-ditch-navy/65 first:rounded-tl-xl last:rounded-tr-xl"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 1 ? "bg-ditch-sand/15" : "bg-white"}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-5 py-3 text-ditch-navy/70"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
