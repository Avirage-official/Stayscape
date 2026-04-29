/**
 * Admin — Service Requests panel
 *
 * Server component showing service tasks for a given property.
 */

import Link from 'next/link';
import SectionHeader from '@/components/admin/SectionHeader';
import ServiceTaskStatusButton from '@/components/admin/ServiceTaskStatusButton';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/* ── Types ─────────────────────────────────────────────────────── */

interface StayRef {
  booking_reference: string | null;
  guest_email: string | null;
}

interface ServiceTask {
  id: string;
  title: string | null;
  description: string | null;
  task_type: string | null;
  status: string;
  createdat: string | null;
  stayid: string | null;
  stays: StayRef | StayRef[] | null;
}

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDate(date: string | null): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-amber-400 bg-amber-400/10';
    case 'in_progress':
      return 'text-blue-400 bg-blue-400/10';
    case 'completed':
      return 'text-emerald-400 bg-emerald-400/10';
    case 'cancelled':
      return 'text-rose-400 bg-rose-400/10';
    default:
      return 'text-white/50 bg-white/10';
  }
}

function getStay(stays: StayRef | StayRef[] | null): StayRef | null {
  if (!stays) return null;
  if (Array.isArray(stays)) return stays[0] ?? null;
  return stays;
}

/* ── Page ───────────────────────────────────────────────────────── */

export default async function ServiceRequestsPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = getSupabaseAdmin();

  const [propertyRes, tasksRes] = await Promise.all([
    supabase.from('properties').select('name').eq('id', propertyId).maybeSingle(),
    supabase
      .from('service_tasks')
      .select(
        'id, title, description, task_type, status, createdat, stayid, stays:stayid(booking_reference, guest_email)',
      )
      .eq('propertyid', propertyId)
      .order('createdat', { ascending: false })
      .limit(50),
  ]);

  const propertyName = (propertyRes.data as { name?: string } | null)?.name ?? 'Hotel';
  const tasks = (tasksRes.data ?? []) as ServiceTask[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/hotels"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors mb-4"
        >
          <span>←</span> Back to Hotels
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <SectionHeader title="Service Requests" />
            <p className="text-[13px] text-white/40 -mt-2">{propertyName}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Guest
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Created
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[13px] text-white/30"
                >
                  No service requests found.
                </td>
              </tr>
            ) : (
              tasks.map((task, idx) => {
                const stay = getStay(task.stays);
                return (
                  <tr
                    key={task.id}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.015] transition-colors ${
                      idx === tasks.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-white/55">{task.task_type ?? '—'}</td>
                    <td className="px-4 py-3 text-white/80 font-medium">{task.title ?? '—'}</td>
                    <td className="px-4 py-3 text-white/55">
                      {stay?.booking_reference ?? task.stayid ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${statusBadgeClass(task.status)}`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-[12px]">
                      {formatDate(task.createdat)}
                    </td>
                    <td className="px-4 py-3">
                      <ServiceTaskStatusButton
                        taskId={task.id}
                        currentStatus={task.status}
                        propertyId={propertyId}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
