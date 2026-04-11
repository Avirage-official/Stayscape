'use client';

export default function GuestLoungeSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header skeleton */}
      <div className="h-[52px] bg-[var(--header-bg)] border-b border-[var(--header-border)] px-4 sm:px-6 flex items-center justify-between">
        <div className="h-4 w-24 bg-[var(--surface-raised)] rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[6px] bg-[var(--surface-raised)] animate-pulse" />
          <div className="h-3 w-12 bg-[var(--surface-raised)] rounded animate-pulse hidden sm:block" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome hero skeleton */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-8 sm:p-10">
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--surface-raised)]" />
              <div className="h-2.5 w-20 bg-[var(--surface-raised)] rounded" />
            </div>
            <div className="h-8 w-64 bg-[var(--surface-raised)] rounded" />
            <div className="h-4 w-80 bg-[var(--surface-raised)] rounded" />
          </div>
        </div>

        {/* Stay card skeleton */}
        <div className="space-y-3 animate-pulse">
          <div className="h-2.5 w-24 bg-[var(--surface-raised)] rounded" />
          <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <div className="h-40 bg-[var(--surface-raised)] rounded-t-xl" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-48 bg-[var(--surface-raised)] rounded" />
              <div className="h-3 w-32 bg-[var(--surface-raised)] rounded" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-10 bg-[var(--surface-raised)] rounded" />
                <div className="h-10 bg-[var(--surface-raised)] rounded" />
                <div className="h-10 bg-[var(--surface-raised)] rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="space-y-3 animate-pulse">
          <div className="h-2.5 w-20 bg-[var(--surface-raised)] rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
