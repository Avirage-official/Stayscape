import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why It Works',
  description:
    'Learn how Stayscape transforms the hospitality experience with AI-powered concierge technology.',
};

export default function WhyItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
