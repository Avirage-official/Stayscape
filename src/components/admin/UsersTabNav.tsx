'use client';

import Link from 'next/link';

interface UsersTabNavProps {
  tab: string;
  counts: {
    total: number;
    standalone: number;
    hotelGuests: number;
  };
}

const TABS = [
  { key: 'all', label: 'All Users', countKey: 'total' as const },
  { key: 'standalone', label: 'Standalone', countKey: 'standalone' as const },
  { key: 'hotel', label: 'Hotel Guests', countKey: 'hotelGuests' as const },
];

export default function UsersTabNav({ tab, counts }: UsersTabNavProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
      {TABS.map(({ key, label, countKey }) => {
        const active = tab === key;
        return (
          <Link
            key={key}
            href={`/admin/users?tab=${key}`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
              active
                ? 'border border-[#C9A84C]/40 bg-[#C9A84C]/15 text-[#C9A84C]'
                : 'border border-transparent text-white/60 hover:text-white/90'
            }`}
          >
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                active ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/10 text-white/50'
              }`}
            >
              {counts[countKey]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
