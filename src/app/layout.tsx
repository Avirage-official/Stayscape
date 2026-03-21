import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased bg-[#0A0A0A] text-white">
        {children}
      </body>
    </html>
  );
}
