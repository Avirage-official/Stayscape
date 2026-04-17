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
    <section className="px-4 sm:px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#C9A84C] text-[14px]">✦</span>
        <h3 className="text-[14px] font-serif text-white/90">Local Insights</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {insights.map((insight) => {
          const expanded = expandedId === insight.id;
          return (
            <button
              key={insight.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : insight.id)}
              className="min-w-[220px] max-w-[280px] rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-left hover:bg-white/[0.1] transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-[18px] leading-none">{insight.icon}</span>
                <div>
                  <p className="text-[12px] text-white/90">{insight.title}</p>
                  <p className="text-[11px] text-white/55">{insight.subtitle}</p>
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
