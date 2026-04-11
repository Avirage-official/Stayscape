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
    <header className="flex items-center justify-between px-6 sm:px-8 lg:px-12 h-[56px] bg-[var(--dashboard-header-bg)]/80 backdrop-blur-md border-b border-[var(--dashboard-header-border)] sticky top-0 z-30">
      {/* Left: Brand */}
      <div className="flex items-center space-x-3">
        <span className="font-serif text-[18px] text-[var(--gold)] tracking-[0.04em]">
          Stayscape
        </span>
        <span className="hidden sm:inline text-[10px] text-[var(--dashboard-text-faint)] tracking-[0.18em] uppercase border-l border-[var(--dashboard-border-subtle)] pl-3 font-light">
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
              width={30}
              height={30}
              className="w-[30px] h-[30px] rounded-[6px] object-cover border border-[var(--gold)]/20"
            />
          ) : (
            <div className="w-[30px] h-[30px] rounded-[6px] bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
              <span className="text-[10px] font-medium text-[var(--gold)]">
                {initials}
              </span>
            </div>
          )}
          <span className="hidden sm:inline text-[12px] text-[var(--dashboard-text-secondary)] font-medium tracking-wide">
            {name.split(' ')[0]}
          </span>
        </div>

        <div className="w-px h-4 bg-[var(--dashboard-border-subtle)]" />

        <button
          type="button"
          onClick={onLogout}
          className="text-[12px] text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-muted)] transition-colors cursor-pointer tracking-wide"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
