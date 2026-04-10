'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FALLBACK_STAY_DAYS, type PlaceCard } from '@/lib/data/discover-fallback';

const stayDays = FALLBACK_STAY_DAYS;

export default function AddToDayDialog({
  open,
  onOpenChange,
  place,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlaceCard | null;
  onConfirm: (placeId: string, day: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handleConfirm = useCallback(() => {
    if (place && selectedDay) {
      onConfirm(place.id, selectedDay);
      setSelectedDay(null);
    }
  }, [place, selectedDay, onConfirm]);

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) setSelectedDay(null);
    onOpenChange(value);
  }, [onOpenChange]);

  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[380px] sm:max-w-[420px] rounded-2xl bg-[var(--discover-surface)] border-[var(--discover-border)] p-0 overflow-hidden">
        {/* Place preview header */}
        <div className="relative h-[140px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${place.image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${place.gradient}`} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm mb-1.5">
              {place.category}
            </Badge>
            <h3 className="text-[18px] font-semibold text-white tracking-tight drop-shadow-lg">{place.name}</h3>
          </div>
        </div>

        <div className="p-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[14px] text-[var(--discover-title)]">Schedule this activity</DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--discover-body)]">
              Choose a day within your stay to add this to your itinerary.
            </DialogDescription>
          </DialogHeader>

          {/* Day selector grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {stayDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDay(day.value)}
                className={`
                  px-3 py-2.5 rounded-xl text-[11px] font-medium
                  border transition-all duration-200 cursor-pointer
                  ${selectedDay === day.value
                    ? 'border-[var(--discover-gold)] bg-[var(--discover-gold-12)] text-[var(--discover-gold)] shadow-[0_0_12px_rgba(200,168,90,0.1)]'
                    : 'border-[var(--discover-border)] bg-[var(--discover-card)] text-[var(--discover-body)] hover:border-[var(--discover-gold)]/40 hover:text-[var(--discover-title)]'
                  }
                `}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleConfirm}
              disabled={!selectedDay}
              className="flex-1 h-10 rounded-xl text-[12px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirm
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-xl text-[12px] text-[var(--discover-body)] hover:text-[var(--discover-title)] px-4"
              >
                Cancel
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
