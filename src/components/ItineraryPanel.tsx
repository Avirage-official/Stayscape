'use client';

import { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useItinerary, type ItineraryItem } from '@/components/ItineraryContext';
import { format, isSameDay, addDays } from 'date-fns';
import ItineraryEmptyState from '@/components/itinerary/ItineraryEmptyState';
import ItineraryDayGroup from '@/components/itinerary/ItineraryDayGroup';

/* ─── Stay date range ─── */
const STAY_CHECK_IN = new Date(2025, 11, 14); // Dec 14
const STAY_CHECK_OUT = new Date(2025, 11, 19); // Dec 19

/* ─── Stay days array ─── */
function generateStayDays(): Date[] {
  const days: Date[] = [];
  let d = new Date(STAY_CHECK_IN);
  while (d <= STAY_CHECK_OUT) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}
const stayDays = generateStayDays();

/* ─── Time / Duration options ─── */
const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];
const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/* ─── Edit dialog ─── */
function EditDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItineraryItem | null;
}) {
  const { updateItem } = useItinerary();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(item?.date);
  const [selectedTime, setSelectedTime] = useState(item?.time ?? '10:00');
  const [selectedDuration, setSelectedDuration] = useState(item?.durationHours ?? 2);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sync state when item changes
  const handleOpenChange = useCallback((value: boolean) => {
    if (value && item) {
      setSelectedDate(item.date);
      setSelectedTime(item.time);
      setSelectedDuration(item.durationHours);
    }
    onOpenChange(value);
  }, [item, onOpenChange]);

  const handleSave = useCallback(() => {
    if (!item || !selectedDate) return;
    updateItem(item.id, {
      date: selectedDate,
      time: selectedTime,
      durationHours: selectedDuration,
    });
    onOpenChange(false);
  }, [item, selectedDate, selectedTime, selectedDuration, updateItem, onOpenChange]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[380px] sm:max-w-[420px] rounded-2xl bg-black/90 border-white/10 p-0 overflow-hidden gap-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="p-5 sm:p-6">
          {/* Place reminder */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl bg-cover bg-center flex-shrink-0 border border-white/10"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="min-w-0">
              <DialogTitle className="text-[14px] font-serif text-white/90 truncate">{item.name}</DialogTitle>
              <DialogDescription className="text-[11px] uppercase tracking-[0.14em] text-white/50">Edit schedule</DialogDescription>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Date picker */}
          <div className="mb-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-2 block">
              Date
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 text-left text-[13px] text-white/90 hover:bg-white/[0.12] transition-colors cursor-pointer flex items-center justify-between"
                >
                  {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Choose a date'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 bg-black/90 border border-white/10" align="start">
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
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-2 block">
                Time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-[13px] text-white hover:bg-white/[0.12] transition-colors cursor-pointer appearance-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-2 block">
                Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-[13px] text-white hover:bg-white/[0.12] transition-colors cursor-pointer appearance-none"
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
              onClick={handleSave}
              disabled={!selectedDate}
              className="flex-1 h-10 rounded-xl text-[12px] font-semibold bg-white/10 text-white/90 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl text-[12px] text-white/60 hover:bg-white/10 hover:text-white/90 px-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Remove confirmation dialog ─── */
function RemoveDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItineraryItem | null;
}) {
  const { removeItem } = useItinerary();

  const handleRemove = useCallback(() => {
    if (!item) return;
    removeItem(item.id);
    onOpenChange(false);
  }, [item, removeItem, onOpenChange]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] rounded-2xl bg-black/90 border-white/10 p-0 overflow-hidden gap-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="p-5 sm:p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <DialogTitle className="text-[15px] font-serif text-white/90 mb-1.5">
            Remove from itinerary?
          </DialogTitle>
          <DialogDescription className="text-[13px] text-white/60 mb-5">
            <span className="font-medium text-white/90">{item.name}</span> will be removed from your plans.
          </DialogDescription>
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleRemove}
              className="flex-1 h-10 rounded-xl text-[12px] font-semibold bg-white/10 text-white/90 hover:bg-white/20 border-white/10"
            >
              Remove
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 rounded-xl text-[12px] text-white/60 hover:bg-white/10 hover:text-white/90"
            >
              Keep
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Day chip selector ─── */
function DayChip({
  date,
  isSelected,
  itemCount,
  onClick,
}: {
  date: Date;
  isSelected: boolean;
  itemCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-shrink-0 flex flex-col items-center justify-center
        w-[60px] h-[60px] rounded-xl border transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-[var(--gold)] bg-[var(--gold)]/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
          : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
        }
      `}
    >
      <span className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
        isSelected ? 'text-[var(--gold)]' : 'text-white/50'
      }`}>
        {format(date, 'EEE')}
      </span>
      <span className={`text-[16px] font-bold leading-tight ${
        isSelected ? 'text-[var(--gold)]' : 'text-white/90'
      }`}>
        {format(date, 'd')}
      </span>
      {itemCount > 0 && (
        <div className={`w-1 h-1 rounded-full mt-0.5 ${
          isSelected ? 'bg-[var(--gold)]' : 'bg-[var(--gold)]/50'
        }`} />
      )}
    </button>
  );
}

/* ─── Main ItineraryPanel ─── */
export default function ItineraryPanel() {
  const { items } = useItinerary();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removeItem, setRemoveItem] = useState<ItineraryItem | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'all'>('all');

  const handleEdit = useCallback((item: ItineraryItem) => {
    setEditItem(item);
    setEditOpen(true);
  }, []);

  const handleRemove = useCallback((item: ItineraryItem) => {
    setRemoveItem(item);
    setRemoveOpen(true);
  }, []);

  // Group items by date
  const groupedByDate = useMemo(() => {
    const groups: { date: Date; items: ItineraryItem[] }[] = [];
    const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const item of sorted) {
      const existing = groups.find((g) => isSameDay(g.date, item.date));
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [items]);

  // Count items per stay day
  const itemCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const day of stayDays) {
      const key = format(day, 'yyyy-MM-dd');
      counts[key] = items.filter((i) => isSameDay(i.date, day)).length;
    }
    return counts;
  }, [items]);

  // Total hours
  const totalHours = useMemo(
    () => items.reduce((sum, i) => sum + i.durationHours, 0),
    [items],
  );

  // Filtered groups for selected day
  const visibleGroups = useMemo(() => {
    if (viewMode === 'all' || !selectedDay) return groupedByDate;
    return groupedByDate.filter((g) => isSameDay(g.date, selectedDay));
  }, [groupedByDate, selectedDay, viewMode]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black/70 discover-card-fade-in">
      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[16px] text-[var(--gold)]">✦</span>
              <h2 className="text-[18px] sm:text-[20px] font-serif tracking-tight text-white/90">
                Itinerary
              </h2>
            </div>
            <p className="text-[13px] text-white/60 ml-[30px]">
              {items.length === 0
                ? 'Plan your perfect itinerary'
                : `${items.length} ${items.length === 1 ? 'activity' : 'activities'} · ${totalHours === 0.5 ? '30m' : `${totalHours}h`} planned`}
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/10">
              <span className="text-[11px] font-semibold text-[var(--gold)]">Dec 14–19</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <ItineraryEmptyState />
      ) : (
        <>
          {/* Day chips */}
          <div className="px-5 sm:px-8 pt-4 pb-3 flex-shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {/* All days chip */}
              <button
                type="button"
                onClick={() => { setViewMode('all'); setSelectedDay(null); }}
                className={`
                  flex-shrink-0 flex items-center justify-center
                  h-[60px] px-4 rounded-xl border transition-all duration-200 cursor-pointer
                  ${viewMode === 'all'
                    ? 'border-[var(--gold)] bg-[var(--gold)]/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
                    : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
                  }
                `}
              >
                <span className={`text-[11px] font-semibold ${
                  viewMode === 'all' ? 'text-[var(--gold)]' : 'text-white/50'
                }`}>
                  All
                </span>
              </button>

              {stayDays.map((day) => (
                <DayChip
                  key={format(day, 'yyyy-MM-dd')}
                  date={day}
                  isSelected={viewMode === 'day' && selectedDay !== null && isSameDay(day, selectedDay)}
                  itemCount={itemCountByDay[format(day, 'yyyy-MM-dd')] ?? 0}
                  onClick={() => { setViewMode('day'); setSelectedDay(day); }}
                />
              ))}
            </div>
          </div>

          {/* Timeline content */}
          <ScrollArea className="flex-1">
            <div className="px-5 sm:px-8 py-6 space-y-6">
              {visibleGroups.length > 0 ? (
                visibleGroups.map((group) => {
                  const groupTotal = group.items.reduce((s, i) => s + i.durationHours, 0);
                  return (
                    <div key={format(group.date, 'yyyy-MM-dd')}>
                      <ItineraryDayGroup
                        date={group.date}
                        items={group.items}
                        totalHours={groupTotal}
                        onEdit={handleEdit}
                        onRemove={handleRemove}
                      />
                      <Separator className="mt-4" />
                    </div>
                  );
                })
              ) : (
                /* Empty day state */
                <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-white/60 mb-1">
                    Nothing planned for this day yet
                  </p>
                  <p className="text-[11px] text-white/40">
                    Explore the <span className="text-[var(--gold)] font-medium">Discover</span> tab to add activities
                  </p>
                </div>
              )}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </>
      )}

      {/* Edit dialog */}
      <EditDialog open={editOpen} onOpenChange={setEditOpen} item={editItem} />

      {/* Remove confirmation dialog */}
      <RemoveDialog open={removeOpen} onOpenChange={setRemoveOpen} item={removeItem} />
    </div>
  );
}
