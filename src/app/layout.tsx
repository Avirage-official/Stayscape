import type { Metadata } from "next";
import { Instrument_Sans, Fraunces, Spectral } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import ThemeProvider from "@/components/ThemeProvider";
import { RegionProvider } from "@/lib/context/region-context";
import { AuthProvider } from "@/lib/context/auth-context";
import CookieConsent from "@/components/CookieConsent";

/*
  TYPOGRAPHY RATIONALE
  ─────────────────────────────────────────────────────────────────
  Instrument Sans  — body/UI  (Rodrigo Fuenzalida, 2022)
    Used by Linear, Vercel, Loewe digital. Optically corrected for
    small sizes. Variable weight axis (100–900) with true optical
    compensation — not just interpolated weights. Feels considered.

  Fraunces  — display headings  (Undercase Type, 2020)
    Variable optical-size + weight + "wonk" axis. Used by The Guardian
    digital, Pentagram editorial work, Letterform Archive. Has a
    moody, slightly wet-ink quality at large sizes. Nothing like the
    theatrical Playfair or the fragile Cormorant. Rare in product work.

  Spectral  — serif accent / italic moments  (Production Type, 2017)
    Designed for long-form reading on screens. Used by Le Monde,
    The Atlantic. Optically dense at body sizes, opens up beautifully
    at 24px+ italics. Replaces Cormorant's fragility with substance.
  ─────────────────────────────────────────────────────────────────
*/

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',   // keep variable name — zero component changes
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',  // keep variable name — zero component changes
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant', // keep variable name — zero component changes
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
      <body className={`${instrumentSans.variable} ${fraunces.variable} ${spectral.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider>
          <AuthProvider>
            <RegionProvider>
              {children}
            </RegionProvider>
          </AuthProvider>
        </ThemeProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
