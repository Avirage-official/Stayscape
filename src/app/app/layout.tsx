import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore & Plan',
  description:
    'Discover places, events, and local experiences. Plan your perfect itinerary with AI assistance.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
