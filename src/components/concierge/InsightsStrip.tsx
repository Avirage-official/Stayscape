'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    <section className="px-4 sm:px-5 py-4 border-t border-white/[0.07]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#C9A84C] text-[14px]">✦</span>
        <h3
          className="text-[15px] font-medium text-white/95"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Local Insights
        </h3>
      </div>

      <div
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {insights.map((insight) => {
          const expanded = expandedId === insight.id;
          return (
            <button
              key={insight.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : insight.id)}
              aria-expanded={expanded}
              aria-controls={`insight-content-${insight.id}`}
              className={cn(
                'group relative p-3 rounded-xl overflow-hidden transition-all duration-300 text-left will-change-transform',
                'border bg-[#111110]',
                'w-[200px] flex-shrink-0 cursor-pointer',
                expanded
                  ? 'border-[rgba(201,169,110,0.3)] shadow-[0_4px_24px_rgba(201,169,110,0.08)]'
                  : 'border-white/[0.08] hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(201,169,110,0.06)]',
              )}
            >
              {/* Dot pattern */}
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-300 pointer-events-none',
                  expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.04)_1px,transparent_1px)] bg-[length:4px_4px]" />
              </div>

              <div className="relative flex flex-col space-y-2">
                {/* Icon + badge */}
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.06] group-hover:bg-[rgba(201,169,110,0.12)] transition-all duration-300 text-[14px] leading-none flex-shrink-0">
                    {insight.icon}
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-medium px-1.5 py-0.5 rounded-md transition-colors duration-300',
                      expanded
                        ? 'bg-[rgba(201,169,110,0.1)] text-[#c9a96e]'
                        : 'bg-white/[0.06] text-[#8a8580] group-hover:bg-[rgba(201,169,110,0.1)] group-hover:text-[#c9a96e]',
                    )}
                  >
                    {insight.subtitle}
                  </span>
                </div>

                {/* Title + chevron */}
                <div className="flex items-center gap-1.5">
                  <p
                    className="flex-1 text-[12px] font-medium text-[#e8e4dc] leading-snug truncate"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {insight.title}
                  </p>
                  <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-white/30 flex-shrink-0 flex items-center"
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.span>
                </div>

                {/* Expandable body */}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key="content"
                      id={`insight-content-${insight.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="h-px bg-[rgba(201,169,110,0.2)] mt-1 mb-2" />
                      <p className="text-[11px] text-white/55 leading-relaxed">
                        {insight.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Gradient border on hover/expanded */}
              <div
                className={cn(
                  'absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-[rgba(201,169,110,0.12)] to-transparent transition-opacity duration-300',
                  expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
