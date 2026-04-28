'use client'
import { useParams } from 'next/navigation';
import DiscoverPanel from '@/components/DiscoverPanel';

export default function DiscoverPage() {
  const params = useParams();
  const stayId = typeof params.stayId === 'string' ? params.stayId : '';
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)',
      background: 'var(--background)' }}>
      <DiscoverPanel stayId={stayId} />
    </div>
  );
}
