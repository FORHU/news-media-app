import { SiteShell } from "@/components/SiteShell";
import { resolveTenantIdFromDomain, getSiteNameFromDomain } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { bannersService } from "@/services/banners.service";
import { Metadata } from "next";

export async function generateStaticParams() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { domain: true },
    });
    return tenants.map((t) => ({ domain: t.domain }));
  } catch (error) {
    console.error("Error generating static params for domains in layout:", error);
    return [];
  }
}

import { getRequestBaseUrl, buildOgImageUrl } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const siteName = getSiteNameFromDomain(domain);
  const baseUrl = await getRequestBaseUrl(domain);
  const logoPath = `/Logo/${
    domain === "jejujapan.com"
      ? "JEJUJAPANLOGO.png"
      : domain === "jejuqq.com"
        ? "JEJUQQLOGO.png"
        : "JEJUTIMELOGO.png"
  }`;
  const logoUrl = `${baseUrl}${logoPath}`;
  const { absolute: ogImageAbsolute } = buildOgImageUrl(logoUrl, baseUrl);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    openGraph: {
      siteName: siteName,
      images: [
        {
          url: ogImageAbsolute,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    }
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const tenantId = await resolveTenantIdFromDomain(domain);

  return (
    <div className={`site-theme-${domain.replace(".", "-")}`}>
      <SiteShell domain={domain}>
        {children}
      </SiteShell>
    </div>
  );
}
