'use client';

import { createContext, useContext } from 'react';

export interface HotelAdminContextValue {
  propertyId: string;
  hotelName: string;
  adminName: string;
}

// Context is not exported directly -- use useHotelAdmin() hook instead.
const HotelAdminContext = createContext<HotelAdminContextValue | null>(null);

export function HotelAdminProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: HotelAdminContextValue;
}) {
  return (
    <HotelAdminContext.Provider value={value}>
      {children}
    </HotelAdminContext.Provider>
  );
}

/**
 * useHotelAdmin()
 * Use this hook in any page inside /hotel-admin/(authenticated)/
 * to access propertyId, hotelName, adminName.
 *
 * Throws if called outside <HotelAdminProvider>.
 */
export function useHotelAdmin(): HotelAdminContextValue {
  const ctx = useContext(HotelAdminContext);
  if (!ctx) {
    throw new Error('useHotelAdmin must be used inside <HotelAdminProvider>');
  }
  return ctx;
}
