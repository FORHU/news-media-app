import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Roboto, Noto_Serif_JP, EB_Garamond, Libre_Baskerville, Space_Mono, Plus_Jakarta_Sans, Arima, Mulish, Voltaire, Inter } from "next/font/google";
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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const arima = Arima({
  variable: "--font-arima",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const voltaire = Voltaire({
  variable: "--font-voltaire",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_SEO.title,
    template: `%s`,
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${roboto.variable} ${notoSerifJP.variable} ${ebGaramond.variable} ${libreBaskerville.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${arima.variable} ${mulish.variable} ${voltaire.variable} ${inter.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>

    </html>
  );
}
