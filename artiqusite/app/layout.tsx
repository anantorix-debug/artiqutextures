import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = "https://aritiqu.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Artiqu Surface — Hand-troweled texture coats & solid wood slat panels",
    template: "%s · Artiqu Surface",
  },
  description:
    "Hand-troweled texture coats and solid wood slat panels — measured, mixed and installed for your room in Salem. No wallpaper. No repeat pattern. Just surface.",
  keywords: [
    "wall texture Salem",
    "lime plaster wall finish",
    "wood slat wall panels",
    "decorative wall texture",
    "micro-cement wall",
  ],
  openGraph: {
    type: "website",
    siteName: "Artiqu Surface",
    title: "Artiqu Surface — Hand-troweled texture coats & solid wood slat panels",
    description:
      "Hand-troweled texture coats and solid wood slat panels — measured, mixed and installed for your room in Salem.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Artiqu Surface — Hand-troweled texture coats & solid wood slat panels",
    description:
      "Hand-troweled texture coats and solid wood slat panels — measured, mixed and installed for your room in Salem.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-paper text-ink" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
