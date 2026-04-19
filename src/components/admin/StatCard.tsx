import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  badge?: ReactNode;
}

export default function StatCard({ label, value, badge }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">{label}</p>
        {badge ? <div>{badge}</div> : null}
      </div>
      <p className="font-serif text-3xl leading-none text-white">{value}</p>
    </div>
  );
}
