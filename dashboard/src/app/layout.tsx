import type { Metadata } from "next";
import { Barlow_Condensed, JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// DOUX.WORK type system: Barlow Condensed for headlines, Source Sans 3 for body, JetBrains Mono for labels and data.
const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["700"] });
const body = Source_Sans_3({ variable: "--font-body", subsets: ["latin"], weight: ["400", "700"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "WRS Growth Dashboard · DOUX.WORK",
  description: "Weather Recovery Solutions: baseline to today across search, website, leads, reputation, measurement and follow-up.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
