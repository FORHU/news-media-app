import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Roboto, Noto_Serif_JP, EB_Garamond, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO, SITE_URL } from "@/config/site";
import { headers } from "next/headers";
import { normalizeHostToDomain, getSiteNameFromDomain } from "@/lib/tenant";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NewsIcons",
    template: "%s",
  },
  icons: {
    icon: "/icons/newsicons.ico",
  },
  description: DEFAULT_SEO.description,
  openGraph: {
    title: "NewsIcons",
    description: DEFAULT_SEO.description,
    url: "/",
    siteName: "NewsIcons",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "NewsIcons",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsIcons",
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${roboto.variable} ${notoSerifJP.variable} ${ebGaramond.variable} ${libreBaskerville.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>

    </html>
  );
}
