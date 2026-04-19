'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

interface AdminNavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: AdminNavItem[] = [
  { label: 'Overview', href: '/admin' },
  { label: 'Properties', href: '/admin/properties' },
  { label: 'Regions', href: '/admin/regions' },
  { label: 'Places', href: '/admin/places' },
  { label: 'Stays', href: '/admin/stays' },
  { label: 'Sync Runs', href: '/admin/sync-runs' },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const brandLabel = useMemo(
    () => (collapsed ? 'SS' : 'Stayscape'),
    [collapsed],
  );

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-white/10 bg-[#0A0A0A] transition-all duration-200 ${collapsed ? 'w-[88px]' : 'w-[280px]'}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-white">{brandLabel}</p>
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#C9A84C]">
              Staff Portal
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/[0.03] text-white/70 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'border-[#C9A84C]/45 bg-[#C9A84C]/10 text-[#C9A84C]'
                  : 'border-transparent text-white/75 hover:border-white/10 hover:bg-white/[0.03] hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {collapsed ? item.label[0] : item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/dashboard"
          className={`block rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white/75 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] ${collapsed ? 'text-center' : ''}`}
          title={collapsed ? 'Guest View' : undefined}
        >
          {collapsed ? 'GV' : 'Guest View'}
        </Link>
      </div>
    </aside>
  );
}
