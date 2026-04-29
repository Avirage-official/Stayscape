'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Bell,
  BedDouble,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import {
  HotelAdminProvider,
  type HotelAdminContextValue,
} from '@/lib/context/hotel-admin-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

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
  const { user, isLoading: authLoading, logout } = useAuth();

  const [hotelAdmin, setHotelAdmin] = useState<HotelAdminContextValue | null>(
    null,
  );
  const [meLoading, setMeLoading] = useState(true);

  // Auth guard — redirect unauthenticated users to /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch hotel admin details once the user is confirmed
  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchMe() {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      if (!token) {
        router.replace('/login?error=no-session');
        return;
      }

      try {
        const res = await fetch('/api/hotel-admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          router.replace('/login?error=no-hotel-admin');
          return;
        }

        if (!res.ok) {
          router.replace('/login?error=auth-failed');
          return;
        }

        const data = (await res.json()) as {
          property_id: string;
          hotel_name: string;
          admin_name: string;
        };

        setHotelAdmin({
          propertyId: data.property_id,
          hotelName: data.hotel_name,
          adminName: data.admin_name,
        });
      } catch {
        router.replace('/login?error=fetch-failed');
      } finally {
        setMeLoading(false);
      }
    }

    void fetchMe();
  }, [authLoading, user, router]);

  function handleSignOut() {
    logout();
    router.push('/login');
  }

  // Show a full-screen loading spinner while auth or /me is resolving
  if (authLoading || meLoading || !hotelAdmin) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    );
  }

  return (
    <HotelAdminProvider value={hotelAdmin}>
      <div className="min-h-screen bg-[#0d0d0d] text-white">
        {/* ── Desktop sidebar ─────────────────────────────────────────── */}
        <aside className="hidden md:flex fixed inset-y-0 left-0 w-[220px] flex-col border-r border-white/[0.06] bg-[#0d0d0d] z-20">
          {/* Hotel name / header */}
          <div className="flex items-center justify-between px-5 h-[60px] border-b border-white/[0.06]">
            <span className="text-[13px] font-medium text-white/80">
              {hotelAdmin.hotelName}
            </span>
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
            <span className="text-[13px] font-medium text-white/80">
              {hotelAdmin.hotelName}
            </span>
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
    </HotelAdminProvider>
  );
}

