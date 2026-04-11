'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import type { CustomerStay } from '@/types/customer';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface CurrentStayCardProps {
  stay: CustomerStay;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getStatusConfig(status: string) {
  const lower = status.toLowerCase();
  if (lower === 'confirmed' || lower === 'paid')
    return { label: status, color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (lower === 'booked')
    return {
      label: 'Booked',
      color: 'text-[var(--gold)]',
      dot: 'bg-[var(--gold)]',
    };
  if (lower === 'checked_in' || lower === 'active')
    return {
      label: 'Checked In',
      color: 'text-emerald-400',
      dot: 'bg-emerald-400',
    };
  return {
    label: status,
    color: 'text-[var(--text-muted)]',
    dot: 'bg-[var(--text-muted)]',
  };
}

function getDaysUntilCheckIn(checkIn: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(checkIn);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function CurrentStayCard({ stay }: CurrentStayCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const statusConfig = getStatusConfig(stay.status);
  const daysUntil = getDaysUntilCheckIn(stay.check_in);

  const containerMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: REVEAL_EASE, delay: 0.15 },
      };

  return (
    <motion.section {...containerMotion}>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
          Current Stay
        </span>
        <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
      </div>

      <div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-xl overflow-hidden hover-lift">
        {/* Hotel image if available */}
        {stay.property?.image_url && (
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <Image
              src={stay.property.image_url}
              alt={stay.property.name ?? 'Hotel'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 960px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, var(--dashboard-card-bg) 0%, transparent 60%)',
              }}
            />

            {/* Days until chip */}
            {daysUntil >= 0 && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="text-[12px] font-medium text-white/90">
                  {daysUntil === 0
                    ? 'Today'
                    : daysUntil === 1
                      ? 'Tomorrow'
                      : `In ${daysUntil} days`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* Hotel name & status */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-serif text-2xl text-[var(--dashboard-text-primary)] leading-tight">
                {stay.property?.name ?? 'Your Stay'}
              </h3>
              {stay.property?.address && (
                <p className="text-[13px] text-[var(--dashboard-text-muted)] mt-1.5">
                  {stay.property.address}
                </p>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)] flex-shrink-0">
              <div
                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
              />
              <span
                className={`text-[11px] font-medium uppercase tracking-wider ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Date & guest details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
            <div>
              <p className="text-[11px] text-[var(--dashboard-text-faint)] uppercase tracking-wider mb-1">
                Check-in
              </p>
              <p className="text-[14px] text-[var(--dashboard-text-secondary)] font-medium">
                {formatDate(stay.check_in)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--dashboard-text-faint)] uppercase tracking-wider mb-1">
                Check-out
              </p>
              <p className="text-[14px] text-[var(--dashboard-text-secondary)] font-medium">
                {formatDate(stay.check_out)}
              </p>
            </div>
            {stay.guests && (
              <div>
                <p className="text-[11px] text-[var(--dashboard-text-faint)] uppercase tracking-wider mb-1">
                  Guests
                </p>
                <p className="text-[14px] text-[var(--dashboard-text-secondary)] font-medium">
                  {stay.guests} {stay.guests === 1 ? 'Guest' : 'Guests'}
                </p>
              </div>
            )}
          </div>

          {/* Room type */}
          {stay.room_type && (
            <div className="flex items-center gap-2 pt-4 border-t border-[var(--dashboard-border-subtle)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--dashboard-text-faint)]"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-[13px] text-[var(--dashboard-text-muted)]">
                {stay.room_type}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
