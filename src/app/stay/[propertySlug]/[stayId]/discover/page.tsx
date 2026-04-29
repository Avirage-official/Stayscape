'use client';
import { useParams } from 'next/navigation';
import DiscoverPanel from '@/components/DiscoverPanel';

export default function DiscoverPage() {
  const params = useParams();
  const stayId = typeof params.stayId === 'string' ? params.stayId : '';
  return (
    <div
      style={{
        height: 'calc(100dvh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      <DiscoverPanel stayId={stayId} />
    </div>
  );
}
