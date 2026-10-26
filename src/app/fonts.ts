import localFont from "next/font/local";

/**
 * Self-hosted copies of the Google Fonts the sites use (Latin subset), loaded with
 * next/font/local. The root layout used to load these through next/font/google,
 * which downloads them from fonts.gstatic.com during `next build` — a flaky step in
 * CI (the "next/font/google queries have exactly one entry" failures). Files live
 * in ./fonts; to add or update a family, drop its latin .woff2 there and add an
 * entry below. The CSS variable names are what globals.css and the site themes use.
 */

export const geistSans = localFont({
  src: "./fonts/geist-100-900.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: "./fonts/geist-mono-100-900.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});

export const playfair = localFont({
  src: "./fonts/playfair-display-700-900.woff2",
  weight: "700 900",
  variable: "--font-playfair",
  display: "swap",
});

export const roboto = localFont({
  src: "./fonts/roboto-400-700.woff2",
  weight: "400 700",
  variable: "--font-roboto",
  display: "swap",
});

export const notoSerifJP = localFont({
  src: "./fonts/noto-serif-jp-400-900.woff2",
  weight: "400 900",
  variable: "--font-noto-serif-jp",
  display: "swap",
});

export const ebGaramond = localFont({
  src: "./fonts/eb-garamond-400-800.woff2",
  weight: "400 800",
  variable: "--font-eb-garamond",
  display: "swap",
});

export const libreBaskerville = localFont({
  src: "./fonts/libre-baskerville-400-700.woff2",
  weight: "400 700",
  variable: "--font-baskerville",
  display: "swap",
});

export const spaceMono = localFont({
  src: [
    { path: "./fonts/space-mono-400.woff2", weight: "400" },
    { path: "./fonts/space-mono-700.woff2", weight: "700" },
  ],
  variable: "--font-space-mono",
  display: "swap",
});

export const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-400-800.woff2",
  weight: "400 800",
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const arima = localFont({
  src: "./fonts/arima-400-700.woff2",
  weight: "400 700",
  variable: "--font-arima",
  display: "swap",
});

export const mulish = localFont({
  src: "./fonts/mulish-400-800.woff2",
  weight: "400 800",
  variable: "--font-mulish",
  display: "swap",
});

export const voltaire = localFont({
  src: "./fonts/voltaire-400.woff2",
  weight: "400",
  variable: "--font-voltaire",
  display: "swap",
});

export const inter = localFont({
  src: "./fonts/inter-400-800.woff2",
  weight: "400 800",
  variable: "--font-inter",
  display: "swap",
});

export const montserrat = localFont({
  src: "./fonts/montserrat-400-900.woff2",
  weight: "400 900",
  variable: "--font-montserrat",
  display: "swap",
});

export const lora = localFont({
  src: "./fonts/lora-400-700.woff2",
  weight: "400 700",
  variable: "--font-lora",
  display: "swap",
});

export const oswald = localFont({
  src: "./fonts/oswald-400-700.woff2",
  weight: "400 700",
  variable: "--font-oswald",
  display: "swap",
});

export const chivo = localFont({
  src: "./fonts/chivo-300-700.woff2",
  weight: "300 700",
  variable: "--font-chivo",
  display: "swap",
});

export const bodoniModa = localFont({
  src: "./fonts/bodoni-moda-400-600.woff2",
  weight: "400 600",
  variable: "--font-bodoni-moda",
  display: "swap",
});

export const cormorantGaramond = localFont({
  src: "./fonts/cormorant-garamond-400-700.woff2",
  weight: "400 700",
  variable: "--font-cormorant",
  display: "swap",
});

export const archivo = localFont({
  src: "./fonts/archivo-400-900.woff2",
  weight: "400 900",
  variable: "--font-archivo",
  display: "swap",
});

export const sourceSerif4 = localFont({
  src: "./fonts/source-serif-4-400-900.woff2",
  weight: "400 900",
  variable: "--font-source-serif",
  display: "swap",
});

export const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-500.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-mono-600.woff2", weight: "600" },
    { path: "./fonts/ibm-plex-mono-700.woff2", weight: "700" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const ptSerif = localFont({
  src: [
    { path: "./fonts/pt-serif-400.woff2", weight: "400" },
    { path: "./fonts/pt-serif-700.woff2", weight: "700" },
  ],
  variable: "--font-pt-serif",
  display: "swap",
});
