import type { SelectedRegion } from '@/lib/context/region-context';
import type { CustomerStay } from '@/types/customer';

export function getSelectedRegionFromStay(stay: CustomerStay): SelectedRegion | null {
  const region = stay.property?.region;
  if (!region) return null;
  if (
    !region.id ||
    !region.name ||
    !region.slug ||
    !region.country_code ||
    !Number.isFinite(region.latitude) ||
    !Number.isFinite(region.longitude) ||
    !Number.isFinite(region.radius_km)
  ) {
    return null;
  }
  return {
    id: region.id,
    name: region.name,
    slug: region.slug,
    latitude: region.latitude,
    longitude: region.longitude,
    radius_km: region.radius_km,
    country_code: region.country_code,
  };
}
