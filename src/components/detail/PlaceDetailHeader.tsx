'use client';

import { Badge } from '@/components/ui/badge';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { PlaceDetail } from '@/components/PlaceDetailDialog';

export default function PlaceDetailHeader({ detail }: { detail: PlaceDetail }) {
  return (
    <div className="relative h-[200px] sm:h-[240px] overflow-hidden flex-shrink-0">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
        style={{ backgroundImage: `url(${detail.image})` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${detail.gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

      {/* Overlaid title area */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm font-medium">
            {detail.category}
          </Badge>
          <span className="text-[11px] text-white/60">{detail.distance}</span>
          <span className="text-[11px] text-white/40">·</span>
          <span className="inline-flex items-center gap-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#C8A85A" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[11px] font-medium text-white/80">{detail.rating.toFixed(1)}</span>
          </span>
        </div>
        <DialogTitle className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight leading-tight drop-shadow-lg">
          {detail.name}
        </DialogTitle>
        <DialogDescription className="text-[12px] text-white/65 mt-1">
          {detail.locationLine}
        </DialogDescription>
      </div>
    </div>
  );
}
