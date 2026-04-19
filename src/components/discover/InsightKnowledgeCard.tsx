'use client';

import { cn } from '@/lib/utils';
import type { InsightCard } from '@/lib/data/discover-fallback';

export default function InsightKnowledgeCard({ insight }: { insight: InsightCard }) {
  return (
    <div
      className={cn(
        'group relative p-4 rounded-xl overflow-hidden transition-all duration-300',
        'border border-white/[0.08] bg-[#111110]',
        'hover:shadow-[0_4px_24px_rgba(201,169,110,0.08)]',
        'hover:-translate-y-0.5 will-change-transform',
        'w-[220px] flex-shrink-0 cursor-default',
      )}
    >
      {/* Dot pattern on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.04)_1px,transparent_1px)] bg-[length:4px_4px]" />
      </div>

      <div className="relative flex flex-col space-y-3">
        {/* Icon + status */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] group-hover:bg-[rgba(201,169,110,0.12)] transition-all duration-300 text-[16px] leading-none">
            {insight.icon}
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-white/[0.06] text-[#8a8580] transition-colors duration-300 group-hover:bg-[rgba(201,169,110,0.1)] group-hover:text-[#c9a96e]">
            {insight.subtitle}
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-medium tracking-tight text-[14px] text-[#e8e4dc] leading-snug"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {insight.title}
        </h3>

        {/* Description */}
        <p
          className="text-[11px] text-[#8a8580] leading-relaxed"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {insight.content}
        </p>

        {/* CTA on hover */}
        <div className="flex justify-end">
          <span className="text-[10px] text-[#c9a96e] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Read more →
          </span>
        </div>
      </div>

      {/* Gradient border on hover */}
      <div className="absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-[rgba(201,169,110,0.15)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
