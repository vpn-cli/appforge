interface DataTableProps {
  columns: string[];
  data: Record<string, string | number>[];
}

export function DataTable({ columns = [], data = [] }: DataTableProps) {
  if (!columns.length || !data.length) {
    return (
      <div className="p-8 border border-dashed rounded-xl bg-muted/20 text-center text-sm text-muted-foreground">
        Data Table: No data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
          <tr>
            {columns.map((col, i) => (
              <th key={i} scope="col" className="px-6 py-4 font-semibold tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-card border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-foreground">
                  {row[col] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
