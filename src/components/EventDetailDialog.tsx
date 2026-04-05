'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useItinerary } from '@/components/ItineraryContext';
import { format } from 'date-fns';
import type { EventCard } from '@/hooks/useDiscoverData';

/* ─── Stay date range (mirrors PlaceDetailDialog) ─── */
const STAY_CHECK_IN = new Date(2025, 11, 14);
const STAY_CHECK_OUT = new Date(2025, 11, 19);

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/* ─── Helpers ─── */
function formatEventDate(startDate: string, startTime: string | null): string {
  try {
    const d = new Date(startDate + 'T00:00:00');
    const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (startTime) return `${datePart} · ${startTime.slice(0, 5)}`;
    return datePart;
  } catch {
    return startDate;
  }
}

function formatPriceRange(
  priceMin: number | null,
  priceMax: number | null,
  currency: string | null,
): string | null {
  if (priceMin == null) return null;
  const sym = currency ?? '$';
  if (priceMin === 0) return 'Free';
  if (priceMax != null && priceMax !== priceMin) return `${sym}${priceMin} – ${sym}${priceMax}`;
  return `${sym}${priceMin}`;
}

/* ─── Gradient backgrounds for event cards ─── */
const EVENT_GRADIENTS = [
  'from-pink-900/90 via-pink-900/50 to-transparent',
  'from-purple-900/90 via-purple-900/50 to-transparent',
  'from-rose-900/90 via-rose-900/50 to-transparent',
  'from-fuchsia-900/90 via-fuchsia-900/50 to-transparent',
];

function getEventGradient(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return EVENT_GRADIENTS[hash % EVENT_GRADIENTS.length];
}

/* ─── Schedule step ─── */
function ScheduleStep({
  event,
  onConfirm,
  onBack,
}: {
  event: EventCard;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const { addItem } = useItinerary();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>(event.start_time?.slice(0, 5) ?? '10:00');
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [successShown, setSuccessShown] = useState(false);

  const handleConfirm = useCallback(() => {
    if (!selectedDate) return;
    addItem({
      placeId: event.id,
      name: event.name,
      category: event.category,
      image: event.image_url ?? '',
      date: selectedDate,
      time: selectedTime,
      durationHours: selectedDuration,
    });
    setSuccessShown(true);
  }, [selectedDate, selectedTime, selectedDuration, event, addItem]);

  if (successShown) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-[var(--discover-gold-12)] border border-[var(--discover-gold-25)] flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10.5L8.5 14L15 6" stroke="var(--discover-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--discover-title)] mb-1.5">Added to your itinerary</h3>
        <p className="text-[13px] text-[var(--discover-body)] mb-1">{event.name}</p>
        {selectedDate && (
          <p className="text-[12px] text-[var(--discover-body)]">
            {format(selectedDate, 'EEE, MMM d')} · {selectedTime} · {selectedDuration}h
          </p>
        )}
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
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-xl bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: event.image_url ? `url(${event.image_url})` : undefined,
            background: event.image_url ? undefined : 'linear-gradient(135deg,#831843,#4a044e)' }}
        />
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--discover-title)] truncate">{event.name}</h3>
          <p className="text-[11px] text-[var(--discover-body)]">{event.venue_name ?? event.category}</p>
        </div>
      </div>

      <Separator className="mb-5" />

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

      <div className="grid grid-cols-2 gap-3 mb-5">
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

/* ─── EventDetailDialog props ─── */
interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventCard | null;
}

export default function EventDetailDialog({ open, onOpenChange, event }: EventDetailDialogProps) {
  const [view, setView] = useState<'detail' | 'schedule'>('detail');
  const fetchedForRef = useRef<string | null>(null);

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) {
      setTimeout(() => setView('detail'), 200);
      fetchedForRef.current = null;
    }
    onOpenChange(value);
  }, [onOpenChange]);

  const handleScheduleConfirm = useCallback(() => {
    setTimeout(() => setView('detail'), 200);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!event) return null;

  const gradient = getEventGradient(event.id);
  const dateDisplay = formatEventDate(event.start_date, event.start_time);
  const priceDisplay = formatPriceRange(event.price_min, event.price_max, event.currency);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[520px] sm:max-w-[580px] max-h-[90vh] rounded-2xl bg-[var(--discover-surface)] border-[var(--discover-border)] p-0 overflow-hidden gap-0 flex flex-col"
      >
        {view === 'detail' ? (
          <div className="flex flex-col max-h-[90vh]">
            {/* Hero image */}
            <div className="relative h-[200px] sm:h-[240px] overflow-hidden flex-shrink-0">
              {event.image_url ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${event.image_url})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-pink-950 via-purple-950 to-slate-900" />
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm font-medium capitalize">
                    {event.category}
                  </Badge>
                  {priceDisplay && (
                    <span className="text-[11px] text-white/70 font-medium">{priceDisplay}</span>
                  )}
                </div>
                <DialogTitle className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                  {event.name}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-white/65 mt-1">
                  {dateDisplay}
                  {event.venue_name && ` · ${event.venue_name}`}
                </DialogDescription>
              </div>
            </div>

            {/* Scrollable body */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 sm:p-6 space-y-5">
                {/* Description */}
                <p className="text-[13px] sm:text-[14px] leading-[1.75] text-[var(--discover-title)]">
                  {event.editorial_summary ?? event.description}
                </p>

                <Separator />

                {/* Meta row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Date', value: dateDisplay },
                    ...(event.venue_name ? [{ label: 'Venue', value: event.venue_name }] : []),
                    ...(priceDisplay ? [{ label: 'Price', value: priceDisplay }] : []),
                  ].map((meta) => (
                    <div key={meta.label} className="bg-[var(--discover-card)] rounded-xl px-3 py-2.5 border border-[var(--discover-border)]">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--discover-body)] mb-0.5">{meta.label}</p>
                      <p className="text-[12px] font-medium text-[var(--discover-title)] leading-tight">{meta.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Sticky action footer */}
            <div className="flex-shrink-0 border-t border-[var(--discover-border)] bg-[var(--discover-surface)] px-5 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setView('schedule')}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                    <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add to itinerary
                </Button>
                {event.ticket_url && (
                  <Button
                    variant="outline"
                    asChild
                    className="h-11 rounded-xl text-[13px] font-medium border-[var(--discover-border)] text-[var(--discover-body)] hover:text-[var(--discover-title)] hover:border-[var(--discover-gold)]/40 px-5"
                  >
                    <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                      Get Tickets
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-1.5">
                        <path d="M4.5 2.5H9.5V7.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ScheduleStep
            event={event}
            onConfirm={handleScheduleConfirm}
            onBack={() => setView('detail')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { EventCard };
export { formatEventDate, formatPriceRange };
