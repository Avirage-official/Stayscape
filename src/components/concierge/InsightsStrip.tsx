'use client';

import { useRef, useState } from 'react';
import { useLocalInsights } from '@/hooks/useDiscoverData';

export default function InsightsStrip() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dataLoadedRef = useRef<boolean | null>(null);
  const { insights, refetch } = useLocalInsights();

  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetch();
  }

  return (
    <section className="px-4 sm:px-5 py-4 border-t border-white/[0.08]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#C9A84C] text-[16px]">✦</span>
        <h3 className="text-[15px] font-serif font-medium text-white/95">Local Insights</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {insights.map((insight) => {
          const expanded = expandedId === insight.id;
          return (
            <button
              key={insight.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : insight.id)}
              className="w-[220px] flex-shrink-0 rounded-2xl border border-white/[0.15] bg-white/[0.10] p-3 text-left shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:bg-white/[0.16] hover:border-[var(--gold)]/30 hover:shadow-[0_4px_20px_rgba(201,168,76,0.10)] transition-all duration-300 overflow-hidden relative group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-2xl bg-[var(--gold)]/0 group-hover:bg-[var(--gold)]/40 transition-all duration-300" />
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden leading-none text-[16px]">{insight.icon}</div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-[12px] text-white/90 truncate">{insight.title}</p>
                  <p className="text-[11px] text-white/55 truncate">{insight.subtitle}</p>
                </div>
              </div>
              {expanded && (
                <p className="mt-2.5 text-[11px] leading-relaxed text-white/70">
                  {insight.content}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}