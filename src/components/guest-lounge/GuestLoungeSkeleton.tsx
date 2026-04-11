'use client';

export default function GuestLoungeSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      {/* Header skeleton */}
      <div className="h-[56px] bg-[var(--dashboard-header-bg)] border-b border-[var(--dashboard-header-border)] px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        <div className="h-4 w-24 bg-[var(--dashboard-surface-raised)] rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-[6px] bg-[var(--dashboard-surface-raised)] animate-pulse" />
          <div className="h-3 w-12 bg-[var(--dashboard-surface-raised)] rounded animate-pulse hidden sm:block" />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10 space-y-8">
        {/* Welcome hero skeleton */}
        <div className="rounded-2xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] p-10 sm:p-12">
          <div className="space-y-5 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--dashboard-surface-raised)]" />
              <div className="h-2.5 w-20 bg-[var(--dashboard-surface-raised)] rounded" />
            </div>
            <div className="h-10 w-72 bg-[var(--dashboard-surface-raised)] rounded" />
            <div className="h-5 w-96 bg-[var(--dashboard-surface-raised)] rounded" />
          </div>
        </div>

        {/* Stay card skeleton */}
        <div className="space-y-3 animate-pulse">
          <div className="h-3 w-24 bg-[var(--dashboard-surface-raised)] rounded" />
          <div className="rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)]">
            <div className="h-48 bg-[var(--dashboard-surface-raised)] rounded-t-xl" />
            <div className="p-6 space-y-4">
              <div className="h-6 w-52 bg-[var(--dashboard-surface-raised)] rounded" />
              <div className="h-4 w-36 bg-[var(--dashboard-surface-raised)] rounded" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-12 bg-[var(--dashboard-surface-raised)] rounded" />
                <div className="h-12 bg-[var(--dashboard-surface-raised)] rounded" />
                <div className="h-12 bg-[var(--dashboard-surface-raised)] rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="space-y-3 animate-pulse">
          <div className="h-3 w-20 bg-[var(--dashboard-surface-raised)] rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)]"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
