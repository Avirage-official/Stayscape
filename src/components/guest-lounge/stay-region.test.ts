import { describe, expect, it } from 'vitest';
import type { CustomerStay } from '@/types/customer';
import { getStaySelectedRegion } from './stay-region';

function buildStay(): CustomerStay {
  return {
    id: 'stay-1',
    user_id: 'user-1',
    property_id: 'property-1',
    booking_reference: 'DEMO-MBS-2025',
    check_in: '2026-04-20',
    check_out: '2026-04-25',
    status: 'confirmed',
    room_type: null,
    guests: 2,
    property: {
      id: 'property-1',
      name: 'Hotel',
      image_url: null,
      address: null,
      city: 'Singapore',
      country: 'Singapore',
      latitude: 1.2,
      longitude: 103.8,
      region_id: 'region-1',
      region: {
        id: 'region-1',
        name: 'Singapore',
        slug: 'singapore',
        latitude: 1.2,
        longitude: 103.8,
        radius_km: 25,
        country_code: 'SG',
      },
    },
  };
}

describe('getStaySelectedRegion', () => {
  it('returns selected region when stay has property region', () => {
    const region = getStaySelectedRegion(buildStay());
    expect(region).toEqual({
      id: 'region-1',
      name: 'Singapore',
      slug: 'singapore',
      latitude: 1.2,
      longitude: 103.8,
      radius_km: 25,
      country_code: 'SG',
    });
  });

  it('returns null when stay has no region', () => {
    const stay = buildStay();
    if (stay.property) stay.property.region = null;
    expect(getStaySelectedRegion(stay)).toBeNull();
  });
});
