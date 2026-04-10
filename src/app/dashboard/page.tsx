'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';

type LoadState = 'loading' | 'ready' | 'error';

/* ─── Fetch helper (pure async, no React state) ─── */

async function fetchDashboardApi(userId: string): Promise<DashboardData> {
  const res = await fetch(
    `/api/customer/dashboard?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to load dashboard',
    );
  }
  return res.json() as Promise<DashboardData>;
}

/* ─── Section Card wrapper ─── */

function SectionCard({
  title,
  children,
  disabled = false,
}: {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={`bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 transition-opacity ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.14em] mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Empty stay state ─── */

function EmptyStayState() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--gold)]/8 border border-[var(--gold)]/15 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--gold)]"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>

      <h3 className="font-serif text-lg text-[var(--text-primary)] mb-2">
        No upcoming stay
      </h3>
      <p className="text-[13px] text-[var(--text-muted)] max-w-xs mx-auto mb-6 leading-relaxed">
        Your next getaway is waiting to be planned. Add a stay to unlock your
        personalized concierge experience.
      </p>

      <button
        type="button"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] transition-colors cursor-pointer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add a Stay
      </button>
    </div>
  );
}

/* ─── Placeholder sections for future features ─── */

function DisabledPlaceholder({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-faint)]">
        {icon}
      </div>
      <div>
        <p className="text-[12px] text-[var(--text-muted)]">{label}</p>
        <p className="text-[10px] text-[var(--text-faint)]">
          Available when a stay is added
        </p>
      </div>
    </div>
  );
}

/* ─── Profile header ─── */

function ProfileHeader({
  name,
  email,
  avatarUrl,
  onLogout,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  onLogout: () => void;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-cover border border-[var(--gold)]/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
            <span className="text-[15px] font-medium text-[var(--gold)]">
              {initials}
            </span>
          </div>
        )}
        <div>
          <h2 className="font-serif text-xl text-[var(--text-primary)] leading-tight">
            {name}
          </h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {email}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors tracking-wide cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}

/* ─── Loading skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)]" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-[var(--surface-raised)] rounded" />
          <div className="h-3 w-56 bg-[var(--surface-raised)] rounded" />
        </div>
      </div>
      <div className="h-48 bg-[var(--surface-raised)] rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-28 bg-[var(--surface-raised)] rounded-xl" />
        <div className="h-28 bg-[var(--surface-raised)] rounded-xl" />
      </div>
    </div>
  );
}

/* ─── Error state ─── */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-[var(--card-bg)] border border-red-500/20 rounded-xl p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/8 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-[13px] text-[var(--text-muted)] mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-[12px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}

/* ─── Itinerary icon ─── */
const ItineraryIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/* ─── Map icon ─── */
const MapIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

/* ─── Chat icon ─── */
const ChatIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/* ─── Settings icon ─── */
const SettingsIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   Dashboard Content — rendered once userId is available
   Uses a lazy useState initializer to kick off the data fetch.
   The promise resolves asynchronously so setState is not called
   during render (satisfies react-hooks/set-state-in-effect).
   ═══════════════════════════════════════════════════════════════ */

function DashboardContent({
  userId,
  onLogout,
}: {
  userId: string;
  onLogout: () => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  /* Kick off initial fetch via a separate lazy initializer.
     All setters are declared above, so no circular reference. */
  useState(() => {
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  });

  const refetch = useCallback(() => {
    setLoadState('loading');
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, [userId]);

  const hasStay = !!data?.upcomingStay;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-[48px] bg-[var(--header-bg)] border-b border-[var(--header-border)] sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <span className="font-serif text-[17px] text-[var(--gold)] tracking-[0.04em]">
            Stayscape
          </span>
          <span className="hidden sm:inline text-[9px] text-[var(--text-faint)] tracking-[0.18em] uppercase border-l border-[var(--border-subtle)] pl-3 font-light">
            My Account
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loadState === 'loading' && <DashboardSkeleton />}

        {loadState === 'error' && (
          <ErrorState message={errorMsg} onRetry={refetch} />
        )}

        {loadState === 'ready' && data && (
          <div className="space-y-6 animate-fade-in-up">
            <ProfileHeader
              name={data.profile.full_name ?? 'Guest'}
              email={data.profile.email}
              avatarUrl={data.profile.avatar_url}
              onLogout={onLogout}
            />

            {hasStay ? (
              <SectionCard title="Upcoming Stay">
                <div className="text-[13px] text-[var(--text-secondary)]">
                  <p className="font-medium text-[var(--text-primary)]">
                    {data.upcomingStay!.property?.name ?? 'Your stay'}
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1">
                    {new Date(data.upcomingStay!.check_in).toLocaleDateString(
                      'en-GB',
                      { day: 'numeric', month: 'short', year: 'numeric' },
                    )}{' '}
                    →{' '}
                    {new Date(data.upcomingStay!.check_out).toLocaleDateString(
                      'en-GB',
                      { day: 'numeric', month: 'short', year: 'numeric' },
                    )}
                  </p>
                  {data.upcomingStay!.room_type && (
                    <p className="text-[11px] text-[var(--text-faint)] mt-1">
                      {data.upcomingStay!.room_type}
                      {data.upcomingStay!.guests
                        ? ` · ${data.upcomingStay!.guests} guest${data.upcomingStay!.guests > 1 ? 's' : ''}`
                        : ''}
                    </p>
                  )}
                </div>
              </SectionCard>
            ) : (
              <EmptyStayState />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SectionCard title="Itinerary" disabled={!hasStay}>
                <DisabledPlaceholder label="Trip itinerary" icon={ItineraryIcon} />
              </SectionCard>

              <SectionCard title="Explore Map" disabled={!hasStay}>
                <DisabledPlaceholder label="Local discoveries" icon={MapIcon} />
              </SectionCard>

              <SectionCard title="Concierge" disabled={!hasStay}>
                <DisabledPlaceholder label="Concierge requests" icon={ChatIcon} />
              </SectionCard>

              <SectionCard title="Trip Preferences" disabled={!hasStay}>
                <DisabledPlaceholder label="Dining & activity preferences" icon={SettingsIcon} />
              </SectionCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page — outer shell that handles auth gating
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  /* Auth loading */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <DashboardSkeleton />
      </div>
    );
  }

  /* Not authenticated — redirect */
  if (!user) {
    router.replace('/login');
    return null;
  }

  /* Authenticated — render content */
  return <DashboardContent userId={user.id} onLogout={handleLogout} />;
}
