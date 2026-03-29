"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  format,
} from "date-fns";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

function Calendar({ selected, onSelect, minDate, maxDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ?? minDate ?? new Date(),
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isDisabled = (d: Date) => {
    if (minDate && isBefore(d, startOfDay(minDate))) return true;
    if (maxDate && isAfter(d, endOfDay(maxDate))) return true;
    return false;
  };

  return (
    <div className={cn("p-0", className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--discover-body)] hover:text-[var(--discover-title)] hover:bg-[var(--discover-active-card)] transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-[var(--discover-title)]">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--discover-body)] hover:text-[var(--discover-title)] hover:bg-[var(--discover-active-card)] transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-[var(--discover-body)] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, monthStart);
          const isSelected = selected && isSameDay(d, selected);
          const disabled = !inMonth || isDisabled(d);

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(d)}
              className={cn(
                "h-8 w-full rounded-lg text-[12px] transition-all duration-150 cursor-pointer",
                disabled && "opacity-25 cursor-not-allowed",
                !disabled && !isSelected && "text-[var(--discover-title)] hover:bg-[var(--discover-active-card)]",
                isSelected &&
                  "bg-[var(--discover-gold)] text-[var(--discover-bg)] font-semibold shadow-[0_0_8px_rgba(200,168,90,0.2)]",
              )}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export { Calendar };
export type { CalendarProps };
