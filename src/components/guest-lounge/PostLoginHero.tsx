'use client';

/**
 * PostLoginHero — Warm Modern wrapper.
 * No background image, no overlay, no animation.
 * The hotel image now lives inside cards, not behind the whole screen.
 */
export default function PostLoginHero({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'var(--background)' }}
    >
      {children}
    </div>
  );
}
