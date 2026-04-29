'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;

interface ServiceTaskStatusButtonProps {
  taskId: string;
  currentStatus: string;
  propertyId: string;
}

export default function ServiceTaskStatusButton({
  taskId,
  currentStatus,
  propertyId,
}: ServiceTaskStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/service-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Failed to update status');
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={loading}
        className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-[12px] text-white/80 focus:outline-none focus:border-[#C9A84C]/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[#1a1a1a]">
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}
