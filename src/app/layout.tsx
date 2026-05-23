import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Roboto, Noto_Serif_JP, EB_Garamond, Libre_Baskerville, Space_Mono, Plus_Jakarta_Sans, Arima, Mulish, Voltaire, Inter, Montserrat, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/config/site";
import { headers } from "next/headers";
import { normalizeHostToDomain, getSiteNameFromDomain, getSiteIconFromDomain, getSiteDescriptionFromDomain } from "@/lib/tenant";

export const dynamic = 'force-dynamic';

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

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");
  const domain = normalizeHostToDomain(host);
  const siteName = getSiteNameFromDomain(domain);
  const siteDescription = getSiteDescriptionFromDomain(domain);
  
  const iconPath = getSiteIconFromDomain(domain);
  const icoUrl = `${iconPath}?v=2`;

  const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : SITE_URL;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s`,
    },
    description: siteDescription,
    icons: {
      icon: icoUrl,
      shortcut: icoUrl,
      apple: icoUrl,
    },
    openGraph: {
      title: siteName,
      description: siteDescription,
      url: "/",
      siteName: siteName,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Block ad network popunders/popups while preserving legitimate window.open usage */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var _o=window.open.bind(window);window.open=function(u,n,s){if(typeof u==='string'&&u.indexOf('facebook.com')!==-1){return _o(u,n,s);}return null;};})();` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${roboto.variable} ${notoSerifJP.variable} ${ebGaramond.variable} ${libreBaskerville.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${arima.variable} ${mulish.variable} ${voltaire.variable} ${inter.variable} ${montserrat.variable} ${lora.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
