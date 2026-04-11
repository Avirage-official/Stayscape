'use client';

import Image from 'next/image';

interface GuestLoungeHeaderProps {
  name: string;
  avatarUrl: string | null;
  onLogout: () => void;
}

export default function GuestLoungeHeader({
  name,
  avatarUrl,
  onLogout,
}: GuestLoungeHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-[52px] bg-[var(--header-bg)]/80 backdrop-blur-md border-b border-[var(--header-border)] sticky top-0 z-30">
      {/* Left: Brand */}
      <div className="flex items-center space-x-3">
        <span className="font-serif text-[17px] text-[var(--gold)] tracking-[0.04em]">
          Stayscape
        </span>
        <span className="hidden sm:inline text-[9px] text-[var(--text-faint)] tracking-[0.18em] uppercase border-l border-[var(--border-subtle)] pl-3 font-light">
          Guest Lounge
        </span>
      </div>

      {/* Right: Avatar + Sign out */}
      <div className="flex items-center gap-3">
        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={28}
              height={28}
              className="w-7 h-7 rounded-[6px] object-cover border border-[var(--gold)]/20"
            />
          ) : (
            <div className="w-7 h-7 rounded-[6px] bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
              <span className="text-[9px] font-medium text-[var(--gold)]">
                {initials}
              </span>
            </div>
          )}
          <span className="hidden sm:inline text-[11px] text-[var(--text-secondary)] font-medium tracking-wide">
            {name.split(' ')[0]}
          </span>
        </div>

        <div className="w-px h-4 bg-[var(--border-subtle)]" />

        <button
          type="button"
          onClick={onLogout}
          className="text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors cursor-pointer tracking-wide"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
