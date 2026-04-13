/**
 * Demo Booking Payloads
 *
 * Pre-defined demo booking IDs mapped to full PmsBookingPayload objects.
 * Used by the demo activation flow so buyers can experience the full
 * PMS → AI curation pipeline without a real hotel PMS connected.
 *
 * Check-in/out dates are calculated dynamically relative to today.
 * Guest email and name are filled from the authenticated user's profile.
 */

import type { PmsBookingPayload } from '@/types/pms';

export interface DemoBookingMeta {
  id: string;
  hotelName: string;
  city: string;
  country: string;
  flag: string;
  tagline: string;
}

export const DEMO_BOOKING_META: DemoBookingMeta[] = [
  {
    id: 'DEMO-MBS-2025',
    hotelName: 'Marina Bay Sands',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    tagline: 'Iconic infinity pool overlooking the city skyline',
  },
  {
    id: 'DEMO-BCN-2025',
    hotelName: 'Hotel Arts Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    tagline: 'Beachfront luxury on the Mediterranean coast',
  },
  {
    id: 'DEMO-PAR-2025',
    hotelName: 'Le Meurice',
    city: 'Paris',
    country: 'France',
    flag: '🇫🇷',
    tagline: 'Palace hotel opposite the Tuileries Garden',
  },
];

/** Format a Date as YYYY-MM-DD without timezone shifting. */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add N days to a date, returning a new Date. */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Return a fully populated PmsBookingPayload for the given demo booking ID,
 * with the logged-in user's details and dynamically calculated dates.
 *
 * Returns null if the booking ID is not a recognised demo ID.
 */
export function getDemoBookingPayload(
  bookingId: string,
  user: { email: string; firstName: string; lastName: string },
): PmsBookingPayload | null {
  const today = new Date();

  switch (bookingId) {
    case 'DEMO-MBS-2025':
      return {
        booking_reference: 'DEMO-MBS-2025',
        guest: {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        property: {
          pms_property_id: 'demo-mbs-sg-001',
          name: 'Marina Bay Sands',
          address: '10 Bayfront Avenue',
          city: 'Singapore',
          country: 'Singapore',
          latitude: 1.2834,
          longitude: 103.8607,
          image_url: null,
        },
        check_in: toDateString(addDays(today, 3)),
        check_out: toDateString(addDays(today, 8)),
        status: 'confirmed',
        room_type: 'Premier Room, City View',
        guests: 2,
        trip_type: 'leisure',
        notes: 'Anniversary trip',
      };

    case 'DEMO-BCN-2025':
      return {
        booking_reference: 'DEMO-BCN-2025',
        guest: {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        property: {
          pms_property_id: 'demo-arts-bcn-001',
          name: 'Hotel Arts Barcelona',
          address: 'Carrer de la Marina, 19-21',
          city: 'Barcelona',
          country: 'Spain',
          latitude: 41.3887,
          longitude: 2.1946,
          image_url: null,
        },
        check_in: toDateString(addDays(today, 5)),
        check_out: toDateString(addDays(today, 10)),
        status: 'confirmed',
        room_type: 'Deluxe Sea View Room',
        guests: 2,
        trip_type: 'romantic',
        notes: 'Honeymoon getaway',
      };

    case 'DEMO-PAR-2025':
      return {
        booking_reference: 'DEMO-PAR-2025',
        guest: {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        property: {
          pms_property_id: 'demo-meurice-par-001',
          name: 'Le Meurice',
          address: '228 Rue de Rivoli',
          city: 'Paris',
          country: 'France',
          latitude: 48.8651,
          longitude: 2.3278,
          image_url: null,
        },
        check_in: toDateString(addDays(today, 7)),
        check_out: toDateString(addDays(today, 11)),
        status: 'confirmed',
        room_type: 'Superior Room, Tuileries Garden View',
        guests: 1,
        trip_type: 'business',
        notes: 'Business conference, early check-in requested',
      };

    default:
      return null;
  }
}
