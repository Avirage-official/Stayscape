'use client';

import type { CategoryItem } from '@/lib/data/discover-fallback';

export default function CategoryCarouselCard({
  item,
  active,
  onClick,
}: {
  item: CategoryItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-shrink-0 relative overflow-hidden rounded-2xl
        w-[130px] h-[100px] sm:w-[150px] sm:h-[110px]
        border transition-all duration-300 ease-out cursor-pointer
        group
        ${active
          ? 'border-[var(--discover-gold)] shadow-[0_0_24px_rgba(200,168,90,0.15)] scale-[1.03]'
          : 'border-[var(--discover-border)] hover:border-[var(--discover-gold)]/40 hover:shadow-[0_0_16px_rgba(200,168,90,0.08)]'
        }
      `}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${item.image})` }}
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        active
          ? 'bg-gradient-to-t from-black/80 via-black/50 to-black/30'
          : 'bg-gradient-to-t from-black/75 via-black/45 to-black/25 group-hover:from-black/70 group-hover:via-black/40 group-hover:to-black/20'
      }`} />

      {/* Active glow indicator */}
      {active && (
        <div className="absolute inset-0 border-2 border-[var(--discover-gold)]/30 rounded-2xl" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-3">
        <span className="text-[18px] mb-0.5 drop-shadow-md">{item.icon}</span>
        <span className={`text-[12px] font-semibold tracking-wide leading-tight drop-shadow-md transition-colors duration-200 ${
          active ? 'text-[var(--discover-gold)]' : 'text-white/95'
        }`}>
          {item.label}
        </span>
        <span className="text-[10px] text-white/60 leading-tight mt-0.5">{item.subtitle}</span>
      </div>
    </button>
  );
}
