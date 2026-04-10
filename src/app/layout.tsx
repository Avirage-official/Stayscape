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
  title: "Stayscape",
  description: "Your premium hospitality companion",
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
