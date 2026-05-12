import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Roboto, Noto_Serif_JP, Space_Mono, Plus_Jakarta_Sans, Arima, Mulish, Voltaire, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO, SITE_URL } from "@/config/site";
import { headers } from "next/headers";
import { normalizeHostToDomain, getSiteNameFromDomain, getSiteIconFromDomain } from "@/lib/tenant";

// Root layout should be static to allow child routes to use SSG/ISR.
// Domain-specific metadata is handled in the (sites)/[domain] layout.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const arima = Arima({
  variable: "--font-arima",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const voltaire = Voltaire({
  variable: "--font-voltaire",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_SEO.title,
    template: `%s | ${DEFAULT_SEO.title}`,
  },
  description: DEFAULT_SEO.description,
  icons: {
    icon: "/icons/newsicons.ico",
  },
  openGraph: {
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    url: "/",
    siteName: DEFAULT_SEO.title,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_SEO.title,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${roboto.variable} ${notoSerifJP.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${arima.variable} ${mulish.variable} ${voltaire.variable} ${inter.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>

    </html>
  );
}
