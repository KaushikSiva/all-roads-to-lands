import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "All Roads Lead to the Lands",
  description:
    "A living map of every city traveling to Outside Lands, powered by JamBase and Convex.",
  openGraph: {
    title: "All Roads Lead to the Lands",
    description: "One festival. A whole world arriving.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
