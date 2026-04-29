'use client';
import ItineraryExperience from '@/components/itinerary/ItineraryExperience';
import { useStay } from '../stay-context';

export default function ItineraryPage() {
  const { stay } = useStay();
  return (
    <div
      style={{
        height: 'calc(100dvh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <ItineraryExperience
        stayId={stay.id}
        checkIn={stay.check_in ?? null}
        checkOut={stay.check_out ?? null}
        guestName={null}
      />
    </div>
  );
}
