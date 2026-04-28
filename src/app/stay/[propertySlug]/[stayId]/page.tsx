'use client';

import ConciergeExperience from '@/components/concierge/ConciergeExperience';
import { useStay } from './stay-context';

export default function StayConciergePage() {
  const { stay } = useStay();

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex',
      flexDirection: 'column', overflow: 'hidden' }}>
      <ConciergeExperience
        stayId={stay.id}
        guestName={null}
        propertyName={stay.property?.name ?? null}
        propertyImageUrl={stay.property?.image_url ?? null}
        propertyCity={stay.property?.city ?? null}
        propertyCountry={stay.property?.country ?? null}
        bookingReference={stay.booking_reference ?? null}
        checkIn={stay.check_in ?? null}
        checkOut={stay.check_out ?? null}
        guestCount={stay.guests ?? null}
      />
    </div>
  );
}
