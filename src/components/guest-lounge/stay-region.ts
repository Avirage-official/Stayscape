import type { SelectedRegion } from '@/lib/context/region-context';
import type { CustomerStay } from '@/types/customer';

export function getStaySelectedRegion(stay: CustomerStay): SelectedRegion | null {
  const region = stay.property?.region;
  if (!region) return null;

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
