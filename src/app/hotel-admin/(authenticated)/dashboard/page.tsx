'use client';

import { useEffect, useState } from 'react';
import { Bell, BedDouble, Users, CheckSquare, LayoutGrid } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getHotelAdminToken } from '@/lib/hotel-admin-token';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const TABLE_HEADERS = ['Request', 'Room', 'Type', 'Status', 'Time'];

export default function HotelAdminDashboardPage() {
  const { adminName } = useHotelAdmin();
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [roomsCount, setRoomsCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      const token = await getHotelAdminToken();

      if (!token) return;

      try {
        const [requestsRes, roomsRes] = await Promise.all([
          fetch('/api/hotel-admin/requests', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/hotel-admin/rooms', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (requestsRes.ok) {
          const requestsData = (await requestsRes.json()) as { tasks: { status: string }[] };
          const activeCount = (requestsData.tasks ?? []).filter(
            (t) => t.status === 'pending' || t.status === 'in_progress',
          ).length;
          setActiveRequestsCount(activeCount);
        }

        if (roomsRes.ok) {
          const roomsData = (await roomsRes.json()) as { rooms: unknown[] };
          setRoomsCount(roomsData.rooms?.length ?? 0);
        }
      } catch {
        // silently fail — stat cards stay at 0
      }
    }

    void fetchStats();
  }, []);

  const STAT_CARDS = [
    { label: 'Active Requests', value: activeRequestsCount, icon: Bell },
    { label: 'Rooms', value: roomsCount, icon: BedDouble },
    { label: 'Guests Today', value: 0, icon: Users },
    { label: 'Pending Tasks', value: 0, icon: CheckSquare },
  ];

  return (
    <div className="px-5 py-8 md:px-8 space-y-8">
      {/* Greeting */}
      <p className="text-[13px] text-white/40">{getGreeting()}, {adminName}.</p>

      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-white -mt-4">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#C9A84C]/60 uppercase tracking-[0.1em]">
                {label}
              </span>
              <Icon size={18} className="text-white/20" />
            </div>
            <span className="text-[28px] font-semibold text-white leading-none">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <LayoutGrid size={14} className="text-white/30" />
          <span className="text-[13px] font-medium text-white/70">
            Recent Requests
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-[11px] text-white/30 uppercase tracking-[0.08em] font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={TABLE_HEADERS.length}
                  className="px-5 py-10 text-center text-[13px] text-white/30"
                >
                  No requests yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
