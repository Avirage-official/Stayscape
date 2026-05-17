/**
 * GET /api/hotel-admin/stats
 *
 * Single aggregated endpoint for the hotel admin dashboard.
 * Runs all DB queries in parallel and returns a single JSON payload
 * so the dashboard only needs one fetch.
 *
 * Auth: Supabase Bearer token → verified → property_id from hotel_admins
 *
 * Returns:
 * {
 *   requests: {
 *     active: number,          // pending + in_progress
 *     pending: number,         // pending only
 *     sla_breaches: number,    // pending tasks older than SLA_THRESHOLD_MS
 *     avg_response_mins: number | null,  // avg mins from created → started_at
 *     by_day: { date: string; count: number }[],  // last 7 days incl. today
 *     by_type: { type: string; count: number }[], // all-time counts by task_type
 *     recent: RecentTask[],    // last 8 tasks sorted newest first
 *   },
 *   stays: {
 *     arrivals_today: number,
 *     departures_today: number,
 *     active_count: number,    // checkindate <= today <= checkoutdate, not cancelled
 *     occupancy_pct: number | null,  // null if no rooms configured
 *   },
 *   rooms: {
 *     total: number,
 *   },
 *   hotspots: { room: string; open_count: number }[],  // rooms with >1 open request
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const SLA_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/* ── Auth helper (same pattern as requests/route.ts) ── */
async function resolvePropertyId(
  request: NextRequest,
): Promise<{ propertyId: string } | NextResponse> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRow, error: adminErr } = await supabase
    .from('hotel_admins')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminErr || !adminRow)
    return NextResponse.json({ error: 'No hotel admin account found' }, { status: 404 });

  return { propertyId: adminRow.property_id as string };
}

function isNextResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

/* ── Types ── */
interface RawTask {
  id: string;
  title: string;
  task_type: string;
  status: string;
  createdat: string;
  started_at: string | null;
  property_rooms: { room_number: string } | null;
  stays: { guest_email: string | null; roomlabel: string | null } | null;
}

interface RawStay {
  id: string;
  checkindate: string;
  checkoutdate: string;
  status: string;
  guestcount: number | null;
}

/* ── Main handler ── */
export async function GET(request: NextRequest) {
  const auth = await resolvePropertyId(request);
  if (isNextResponse(auth)) return auth;
  const { propertyId } = auth;

  const supabase = getSupabaseAdmin();
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 7-day window for the chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  /* ── Parallel fetches ── */
  const [tasksResult, staysResult, roomsResult] = await Promise.all([
    // All tasks (unfiltered — we slice client side for the chart window)
    supabase
      .from('service_tasks')
      .select('id, title, task_type, status, createdat, started_at, property_rooms(room_number), stays(guest_email, roomlabel)')
      .eq('propertyid', propertyId)
      .order('createdat', { ascending: false }),

    // All non-cancelled stays
    supabase
      .from('stays')
      .select('id, checkindate, checkoutdate, status, guestcount')
      .eq('propertyid', propertyId)
      .neq('status', 'cancelled'),

    // Room count only
    supabase
      .from('property_rooms')
      .select('id', { count: 'exact', head: true })
      .eq('propertyid', propertyId),
  ]);

  if (tasksResult.error) {
    console.error('[stats] tasks error', tasksResult.error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const tasks  = (tasksResult.data ?? []) as RawTask[];
  const stays  = (staysResult.data ?? []) as RawStay[];
  const totalRooms = roomsResult.count ?? 0;

  /* ── Request aggregations ── */
  const now = Date.now();

  const active  = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const pending = tasks.filter((t) => t.status === 'pending');

  // SLA breaches: pending tasks older than 15 mins with no response
  const slaBreaches = pending.filter(
    (t) => now - new Date(t.createdat).getTime() > SLA_THRESHOLD_MS,
  );

  // Avg response time: tasks that have a started_at (in_progress or completed)
  const respondedTasks = tasks.filter((t) => t.started_at);
  const avgResponseMins = respondedTasks.length > 0
    ? Math.round(
        respondedTasks.reduce((sum, t) => {
          return sum + (new Date(t.started_at!).getTime() - new Date(t.createdat).getTime());
        }, 0) / respondedTasks.length / 60_000,
      )
    : null;

  // 7-day chart: build a map of date → count for the last 7 days
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  tasks
    .filter((t) => t.createdat.slice(0, 10) >= sevenDaysAgoStr)
    .forEach((t) => {
      const day = t.createdat.slice(0, 10);
      if (day in dayMap) dayMap[day]++;
    });
  const byDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // By type (all time)
  const typeMap: Record<string, number> = {};
  tasks.forEach((t) => { typeMap[t.task_type] = (typeMap[t.task_type] ?? 0) + 1; });
  const byType = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Recent 8 tasks
  const recent = tasks.slice(0, 8).map((t) => ({
    id: t.id,
    title: t.title,
    task_type: t.task_type,
    status: t.status,
    createdat: t.createdat,
    room: t.property_rooms?.room_number ?? t.stays?.roomlabel ?? null,
    guest_email: t.stays?.guest_email ?? null,
  }));

  // Room hotspots: rooms with >1 open request
  const roomOpenMap: Record<string, number> = {};
  active.forEach((t) => {
    const room = t.property_rooms?.room_number ?? t.stays?.roomlabel;
    if (room) roomOpenMap[room] = (roomOpenMap[room] ?? 0) + 1;
  });
  const hotspots = Object.entries(roomOpenMap)
    .filter(([, c]) => c > 1)
    .map(([room, open_count]) => ({ room, open_count }))
    .sort((a, b) => b.open_count - a.open_count);

  /* ── Stay aggregations ── */
  const arrivalsToday   = stays.filter((s) => s.checkindate  === todayStr).length;
  const departuresToday = stays.filter((s) => s.checkoutdate === todayStr).length;
  const activeStays     = stays.filter((s) => s.checkindate <= todayStr && s.checkoutdate >= todayStr);
  const occupancyPct    = totalRooms > 0
    ? Math.round((activeStays.length / totalRooms) * 100)
    : null;

  return NextResponse.json({
    requests: {
      active:             active.length,
      pending:            pending.length,
      sla_breaches:       slaBreaches.length,
      avg_response_mins:  avgResponseMins,
      by_day:             byDay,
      by_type:            byType,
      recent,
    },
    stays: {
      arrivals_today:   arrivalsToday,
      departures_today: departuresToday,
      active_count:     activeStays.length,
      occupancy_pct:    occupancyPct,
    },
    rooms: {
      total: totalRooms,
    },
    hotspots,
  });
}
