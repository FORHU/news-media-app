import type { Metadata } from "next";
import { geistSans, geistMono, playfair, roboto, notoSerifJP, ebGaramond, libreBaskerville, spaceMono, plusJakartaSans, arima, mulish, voltaire, inter, montserrat, lora, oswald, chivo, bodoniModa, cormorantGaramond, archivo, sourceSerif4, ibmPlexMono, ptSerif } from "./fonts";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/config/site";
import { headers } from "next/headers";
import { normalizeHostToDomain, getSiteNameFromDomain, getSiteIconFromDomain, getSiteDescriptionFromDomain, getSiteLanguageFromDomain, getSiteLocaleFromDomain } from "@/lib/tenant";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");
  const domain = normalizeHostToDomain(host);
  const siteName = getSiteNameFromDomain(domain);
  const siteDescription = getSiteDescriptionFromDomain(domain);
  
  const iconPath = getSiteIconFromDomain(domain);
  const icoUrl = iconPath;

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
      locale: getSiteLocaleFromDomain(domain),
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
  const headersList = await headers();
  const domain = normalizeHostToDomain(headersList.get("host"));
  const lang = getSiteLanguageFromDomain(domain);

  return (
    <html lang={lang}>
      <head>
        {/* Block ad network popunders/popups while preserving legitimate window.open usage */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var _o=window.open.bind(window);window.open=function(u,n,s){if(typeof u==='string'&&u.indexOf('facebook.com')!==-1){return _o(u,n,s);}return null;};})();` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${roboto.variable} ${notoSerifJP.variable} ${ebGaramond.variable} ${libreBaskerville.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${arima.variable} ${mulish.variable} ${voltaire.variable} ${inter.variable} ${montserrat.variable} ${lora.variable} ${oswald.variable} ${chivo.variable} ${bodoniModa.variable} ${cormorantGaramond.variable} ${archivo.variable} ${sourceSerif4.variable} ${ibmPlexMono.variable} ${ptSerif.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
