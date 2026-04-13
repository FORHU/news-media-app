export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.newsicons.com").replace(/\/$/, "");

export const DEFAULT_SEO = {
  title: "NewsIcons",
  description: "Media & Content Hub for curated news, blogs, and insights.",
};

export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default-1200x630.png`;

