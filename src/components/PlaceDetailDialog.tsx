'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useItinerary } from '@/components/ItineraryContext';
import { format } from 'date-fns';
import { FALLBACK_PLACE_DETAILS } from '@/lib/data/discover-fallback';
import PlaceDetailHeader from '@/components/detail/PlaceDetailHeader';
import PlaceDetailContent from '@/components/detail/PlaceDetailContent';

/* ─── Extended place detail data ─── */

interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  distance: string;
  gradient: string;
  image: string;
  bookingUrl: string;
  /* editorial detail fields */
  locationLine: string;
  editorialDescription: string;
  thingsToDo: string[];
  whatToLookOutFor: string[];
  whatToBring: string[];
  recommendedDuration: string;
  bestTimeToGo: string;
}

/* ─── Rich editorial data keyed by place id ─── */

const placeDetails = FALLBACK_PLACE_DETAILS;

/* ─── Fallback detail generator ─── */
function getPlaceDetail(place: { id: string; name: string; category: string; description: string; rating: number; distance: string; gradient: string; image: string; bookingUrl: string }): PlaceDetail {
  const extra = placeDetails[place.id];
  if (extra) {
    return { ...place, ...extra };
  }
  return {
    ...place,
    locationLine: `${place.category} · New York`,
    editorialDescription: place.description,
    thingsToDo: ['Explore the surroundings', 'Take in the atmosphere', 'Capture the moment'],
    whatToLookOutFor: ['Local recommendations from fellow visitors', 'Seasonal highlights and events'],
    whatToBring: ['Comfortable shoes', 'A camera', 'An open mind'],
    recommendedDuration: '1–3 hours',
    bestTimeToGo: 'Morning or late afternoon',
  };
}

/* ─── Stay date range ─── */
const STAY_CHECK_IN = new Date(2025, 11, 14); // Dec 14
const STAY_CHECK_OUT = new Date(2025, 11, 19); // Dec 19

/* ─── Time options ─── */
const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/* ─── Scheduling step ─── */
function ScheduleStep({
  place,
  onConfirm,
  onBack,
}: {
  place: PlaceDetail;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const { addItem } = useItinerary();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [successShown, setSuccessShown] = useState(false);

  const handleConfirm = useCallback(() => {
    if (!selectedDate) return;
    addItem({
      placeId: place.id,
      name: place.name,
      category: place.category,
      image: place.image,
      date: selectedDate,
      time: selectedTime,
      durationHours: selectedDuration,
    });
    setSuccessShown(true);
  }, [selectedDate, selectedTime, selectedDuration, place, addItem]);

  if (successShown) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-[var(--discover-gold-12)] border border-[var(--discover-gold-25)] flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10.5L8.5 14L15 6" stroke="var(--discover-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--discover-title)] mb-1.5">Added to your itinerary</h3>
        <p className="text-[13px] text-[var(--discover-body)] mb-1">{place.name}</p>
        <p className="text-[12px] text-[var(--discover-body)]">
          {format(selectedDate!, 'EEE, MMM d')} · {selectedTime} · {selectedDuration}h
        </p>
        <Button
          onClick={onConfirm}
          className="mt-6 h-10 rounded-xl text-[12px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90 px-8"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 animate-fade-in">
      {/* Compact place reminder */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-xl bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(${place.image})` }}
        />
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--discover-title)] truncate">{place.name}</h3>
          <p className="text-[11px] text-[var(--discover-body)]">{place.locationLine}</p>
        </div>
      </div>

      <Separator className="mb-5" />

      {/* Date picker */}
      <div className="mb-4">
        <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)] mb-2 block">
          Date
        </label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full h-10 rounded-xl border border-[var(--discover-border)] bg-[var(--discover-card)] px-3.5 text-left text-[13px] text-[var(--discover-title)] hover:border-[var(--discover-gold)]/40 transition-colors cursor-pointer flex items-center justify-between"
            >
              {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Choose a date'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--discover-body)]">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setCalendarOpen(false); }}
              minDate={STAY_CHECK_IN}
              maxDate={STAY_CHECK_OUT}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time and Duration row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Time */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)] mb-2 block">
            Time
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full h-10 rounded-xl border border-[var(--discover-border)] bg-[var(--discover-card)] px-3 text-[13px] text-[var(--discover-title)] hover:border-[var(--discover-gold)]/40 transition-colors cursor-pointer appearance-none"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)] mb-2 block">
            Duration
          </label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full h-10 rounded-xl border border-[var(--discover-border)] bg-[var(--discover-card)] px-3 text-[13px] text-[var(--discover-title)] hover:border-[var(--discover-gold)]/40 transition-colors cursor-pointer appearance-none"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>{d === 0.5 ? '30 min' : `${d} hr${d > 1 ? 's' : ''}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <Button
          onClick={handleConfirm}
          disabled={!selectedDate}
          className="flex-1 h-10 rounded-xl text-[12px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
            <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Confirm add
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-10 rounded-xl text-[12px] text-[var(--discover-body)] hover:text-[var(--discover-title)] px-4"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─── Main PlaceDetailDialog ─── */

interface PlaceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: {
    id: string;
    name: string;
    category: string;
    description: string;
    rating: number;
    distance: string;
    gradient: string;
    image: string;
    bookingUrl: string;
  } | null;
}

export default function PlaceDetailDialog({ open, onOpenChange, place }: PlaceDetailDialogProps) {
  const [view, setView] = useState<'detail' | 'schedule'>('detail');

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) {
      // Reset to detail view on close
      setTimeout(() => setView('detail'), 200);
    }
    onOpenChange(value);
  }, [onOpenChange]);

  const handleScheduleConfirm = useCallback(() => {
    setTimeout(() => setView('detail'), 200);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!place) return null;

  const detail: PlaceDetail = getPlaceDetail(place);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[520px] sm:max-w-[580px] max-h-[90vh] rounded-2xl bg-[var(--discover-surface)] border-[var(--discover-border)] p-0 overflow-hidden gap-0 flex flex-col"
      >

        {view === 'detail' ? (
          <div className="flex flex-col max-h-[90vh]">
            <PlaceDetailHeader detail={detail} />
            <PlaceDetailContent detail={detail} onAddToItinerary={() => setView('schedule')} />
          </div>
        ) : (
          /* ─── Schedule step ─── */
          <ScheduleStep
            place={detail}
            onConfirm={handleScheduleConfirm}
            onBack={() => setView('detail')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export { getPlaceDetail, STAY_CHECK_IN, STAY_CHECK_OUT };
export type { PlaceDetail };
