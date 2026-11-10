import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Body & UI: Inter
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-inter",
});

// Headings: Geist Serif (self-hosted, from Vercel's geist package)
const geistSerif = localFont({
  src: "./fonts/GeistSerif-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-geist-serif",
});

export const metadata: Metadata = {
  title: "Legal Compli — Christina Malik, Injury Attorney",
  description:
    "Christina Malik helps those injured by negligence in car crashes, falls, and workplace incidents. You pay no fees unless we win.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // classes on <html> are toggled at runtime by the loader / ScrollSmoother
    <html lang="en" className={`${inter.variable} ${geistSerif.variable}`} suppressHydrationWarning>
      <head>
        {/* intro loader: only when JS runs (no-JS visitors see the page straight away) */}
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.add("is-loading");' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
