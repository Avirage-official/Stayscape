import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import ThemeProvider from "@/components/ThemeProvider";
import { RegionProvider } from "@/lib/context/region-context";

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stayscape.vercel.app'),
  title: {
    default: 'Stayscape — Your AI-Powered Travel Concierge',
    template: '%s | Stayscape',
  },
  description: 'Discover local gems, plan your perfect stay, and explore curated experiences with Stayscape — the AI concierge for modern travelers.',
  keywords: ['travel', 'concierge', 'AI', 'itinerary', 'hotel', 'local experiences', 'travel planner', 'Stayscape'],
  authors: [{ name: 'Stayscape' }],
  creator: 'Stayscape',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Stayscape',
    title: 'Stayscape — Your AI-Powered Travel Concierge',
    description: 'Discover local gems, plan your perfect stay, and explore curated experiences.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Stayscape — AI Travel Concierge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stayscape — Your AI-Powered Travel Concierge',
    description: 'Discover local gems, plan your perfect stay, and explore curated experiences.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${playfair.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider>
          <RegionProvider>
            {children}
          </RegionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
