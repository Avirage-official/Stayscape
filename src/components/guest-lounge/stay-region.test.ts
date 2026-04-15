import { describe, expect, it } from 'vitest';
import type { CustomerStay } from '@/types/customer';
import { getSelectedRegionFromStay } from './stay-region';

const baseStay: CustomerStay = {
  id: 'stay-1',
  user_id: 'user-1',
  property_id: 'property-1',
  check_in: '2026-05-01',
  check_out: '2026-05-05',
  status: 'confirmed',
  room_type: null,
  guests: 2,
  property: null,
};

describe('getSelectedRegionFromStay', () => {
  it('returns region when stay includes valid joined region', () => {
    const region = getSelectedRegionFromStay({
      ...baseStay,
      property: {
        id: 'property-1',
        name: 'Hotel Arts Barcelona',
        image_url: null,
        address: null,
        city: 'Barcelona',
        country: 'Spain',
        latitude: 41.39,
        longitude: 2.19,
        region_id: 'region-barcelona',
        region: {
          id: 'region-barcelona',
          name: 'Barcelona',
          slug: 'barcelona',
          latitude: 41.39,
          longitude: 2.19,
          radius_km: 35,
          country_code: 'ES',
        },
      },
    });

    expect(region).toEqual({
      id: 'region-barcelona',
      name: 'Barcelona',
      slug: 'barcelona',
      latitude: 41.39,
      longitude: 2.19,
      radius_km: 35,
      country_code: 'ES',
    });
  });

  it('returns null when stay has no region join', () => {
    expect(getSelectedRegionFromStay(baseStay)).toBeNull();
  });

  it('returns null when region is incomplete', () => {
    expect(
      getSelectedRegionFromStay({
        ...baseStay,
        property: {
          id: 'property-1',
          name: 'Any Hotel',
          image_url: null,
          address: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          region_id: 'region-any',
          region: {
            id: 'region-any',
            name: 'Any',
            slug: 'any',
            latitude: Number.NaN,
            longitude: 2,
            radius_km: 20,
            country_code: 'ES',
          },
        },
      }),
    ).toBeNull();
  });
});
