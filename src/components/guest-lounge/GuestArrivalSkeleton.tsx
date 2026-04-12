'use client';

/**
 * GuestArrivalSkeleton — loading state for the cinematic arrival screen.
 * Full viewport, dark, minimal — preserves the premium mood while data loads.
 */
export default function GuestArrivalSkeleton() {
  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col">
      {/* Top nav skeleton */}
      <div className="flex items-center justify-between px-6 sm:px-10 lg:px-14 h-[64px]">
        <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
        <div className="h-3 w-14 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Center content skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="h-10 w-72 sm:w-96 bg-white/[0.03] rounded-lg animate-pulse mb-4" />
        <div className="h-4 w-40 bg-white/[0.02] rounded animate-pulse mb-12" />
        <div className="h-14 w-full max-w-[640px] bg-white/[0.03] rounded-2xl animate-pulse" />
        <div className="flex gap-2 mt-6">
          <div className="h-8 w-36 bg-white/[0.02] rounded-full animate-pulse" />
          <div className="h-8 w-44 bg-white/[0.02] rounded-full animate-pulse" />
          <div className="h-8 w-48 bg-white/[0.02] rounded-full animate-pulse hidden sm:block" />
        </div>
      </div>

      {/* Bottom stay meta skeleton */}
      <div className="flex justify-center pb-8">
        <div className="h-3 w-64 bg-white/[0.02] rounded animate-pulse" />
      </div>
    </div>
  );
}
