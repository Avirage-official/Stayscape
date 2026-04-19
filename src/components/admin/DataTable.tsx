import type { ReactNode } from 'react';

interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  statusColumns?: string[];
  emptyMessage?: string;
}

const EMERALD_STATUSES = ['completed', 'success', 'active', 'confirmed', 'healthy', 'enriched'];
const AMBER_STATUSES = ['running', 'pending', 'queued', 'in_progress', 'upcoming', 'warning'];

function getStatusStyles(value: string): string {
  const normalized = value.toLowerCase();
  if (EMERALD_STATUSES.some((status) => normalized.includes(status))) {
    return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300';
  }
  if (AMBER_STATUSES.some((status) => normalized.includes(status))) {
    return 'border-amber-400/30 bg-amber-400/15 text-amber-300';
  }
  return 'border-red-400/30 bg-red-400/15 text-red-300';
}

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  statusColumns = [],
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 text-left text-[11px] uppercase tracking-[0.15em] text-white/60">
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-medium ${column.className ?? ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-white/50"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="border-b border-white/10 last:border-b-0 hover:bg-[#C9A84C]/10"
                >
                  {columns.map((column) => {
                    const rendered = column.render
                      ? column.render(row)
                      : (row as Record<string, ReactNode>)[column.key];

                    const rawValue = (row as Record<string, unknown>)[column.key];
                    const shouldBadge =
                      statusColumns.includes(column.key) &&
                      typeof rawValue === 'string' &&
                      !column.render;

                    return (
                      <td key={column.key} className={`px-4 py-3 text-white/85 ${column.className ?? ''}`}>
                        {shouldBadge ? (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${getStatusStyles(rawValue)}`}
                          >
                            {rawValue.replaceAll('_', ' ')}
                          </span>
                        ) : (
                          rendered
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
