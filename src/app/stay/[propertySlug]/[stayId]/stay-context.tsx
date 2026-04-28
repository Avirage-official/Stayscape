'use client';

import { createContext, useContext } from 'react';
import type { CustomerStay } from '@/types/customer';

export interface StayContextValue {
  stay: CustomerStay;
  userId: string;
}

export const StayContext = createContext<StayContextValue | null>(null);

export function useStay(): StayContextValue {
  const ctx = useContext(StayContext);
  if (!ctx) throw new Error('useStay must be used inside the stay layout');
  return ctx;
}
