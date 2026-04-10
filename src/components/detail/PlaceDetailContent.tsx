'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { PlaceDetail } from '@/components/PlaceDetailDialog';

function DetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)] mb-2.5">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[var(--discover-title)]">
            <span className="text-[var(--discover-gold)] mt-1 flex-shrink-0 text-[8px]">◆</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PlaceDetailContent({
  detail,
  onAddToItinerary,
}: {
  detail: PlaceDetail;
  onAddToItinerary: () => void;
}) {
  return (
    <>
      {/* Scrollable content body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-5 sm:p-6 space-y-6">
          {/* Editorial description */}
          <p className="text-[13px] sm:text-[14px] leading-[1.75] text-[var(--discover-title)]">
            {detail.editorialDescription}
          </p>

          <Separator />

          {/* Metadata row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Category', value: detail.category },
              { label: 'Distance', value: detail.distance },
              { label: 'Duration', value: detail.recommendedDuration },
              { label: 'Best time', value: detail.bestTimeToGo },
            ].map((meta) => (
              <div key={meta.label} className="bg-[var(--discover-card)] rounded-xl px-3 py-2.5 border border-[var(--discover-border)]">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--discover-body)] mb-0.5">{meta.label}</p>
                <p className="text-[12px] font-medium text-[var(--discover-title)] leading-tight">{meta.value}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Editorial sections */}
          <DetailSection title="Things to do" items={detail.thingsToDo} />

          <Separator />

          <DetailSection title="What to look out for" items={detail.whatToLookOutFor} />

          <Separator />

          <DetailSection title="What to bring" items={detail.whatToBring} />
        </div>
      </ScrollArea>

      {/* Sticky action footer */}
      <div className="flex-shrink-0 border-t border-[var(--discover-border)] bg-[var(--discover-surface)] px-5 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={onAddToItinerary}
            className="flex-1 h-11 rounded-xl text-[13px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
              <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add to itinerary
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-11 rounded-xl text-[13px] font-medium border-[var(--discover-border)] text-[var(--discover-body)] hover:text-[var(--discover-title)] hover:border-[var(--discover-gold)]/40 px-5"
          >
            <a href={detail.bookingUrl} target="_blank" rel="noopener noreferrer">
              Visit website
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-1.5">
                <path d="M4.5 2.5H9.5V7.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}
