'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Bell,
  BedDouble,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';

const NAV_LINKS = [
  { href: '/hotel-admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/hotel-admin/requests', label: 'Requests', icon: Bell },
  { href: '/hotel-admin/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/hotel-admin/guests', label: 'Guests', icon: Users },
  { href: '/hotel-admin/settings', label: 'Settings', icon: Settings },
];

export default function HotelAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  function handleSignOut() {
    logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[220px] flex-col border-r border-white/[0.06] bg-[#0d0d0d] z-20">
        {/* Hotel name / header */}
        <div className="flex items-center justify-between px-5 h-[60px] border-b border-white/[0.06]">
          <span className="text-[13px] font-medium text-white/80">Hotel</span>
          <button
            onClick={handleSignOut}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="md:pl-[220px] flex flex-col min-h-screen">
        {/* Mobile top header */}
        <header className="flex md:hidden items-center justify-between px-4 h-[56px] border-b border-white/[0.06] bg-[#0d0d0d] sticky top-0 z-10">
          <span className="text-[13px] font-medium text-white/80">Hotel</span>
          <button
            onClick={handleSignOut}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* ── Mobile bottom nav ──────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-white/[0.06] bg-[#0d0d0d] z-20">
          <div className="flex items-center justify-around h-[60px]">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-0.5 px-2 text-[10px] transition-colors ${
                    isActive ? 'text-[#C9A84C]' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
