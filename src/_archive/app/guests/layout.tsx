import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Your Stay Starts Here',
  description: 'Access your Stayscape account to manage your stay, connect with your hotel, and discover local experiences curated just for you.',
  openGraph: {
    title: 'Sign In — Your Stay Starts Here | Stayscape',
    description: 'Access your Stayscape account to manage your stay, connect with your hotel, and discover local experiences curated just for you.',
    url: 'https://www.thestayscape.com/guests',
  },
  twitter: {
    title: 'Sign In — Your Stay Starts Here | Stayscape',
    description: 'Access your Stayscape account to manage your stay, connect with your hotel, and discover local experiences curated just for you.',
  },
}

export default function GuestsLayout({ children }: { children: React.ReactNode }) {
  return children
}
