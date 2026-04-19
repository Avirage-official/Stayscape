'use client';

import type { InsightCard } from '@/lib/data/discover-fallback';

export default function InsightKnowledgeCard({ insight }: { insight: InsightCard }) {
  return (
    <div className="
      flex-shrink-0 w-[200px] sm:w-[220px]
      rounded-xl border border-[var(--discover-border)]
      bg-[var(--discover-card)] p-4
      overflow-hidden
      transition-all duration-300 ease-out
      hover:border-[var(--discover-gold)]/30
      hover:bg-[var(--discover-active-card)]
      discover-hover-lift group
    ">
      <div className="flex items-start gap-3 mb-2.5">
        <span className="
          flex items-center justify-center w-9 h-9 rounded-lg
          bg-[var(--discover-gold-8)] border border-[var(--discover-gold-15)]
          text-[16px] leading-none flex-shrink-0 overflow-hidden
          transition-all duration-300
          group-hover:bg-[var(--discover-gold-12)]
        ">
          {insight.icon}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h4 className="text-[13px] font-semibold text-[var(--discover-title)] leading-tight truncate">{insight.title}</h4>
          <p className="text-[10px] text-[var(--discover-body)] mt-0.5 truncate">{insight.subtitle}</p>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--discover-body)] line-clamp-4">{insight.content}</p>
    </div>
  );
}