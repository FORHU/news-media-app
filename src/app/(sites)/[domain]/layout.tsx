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

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const siteName = getSiteNameFromDomain(domain);

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    openGraph: {
      siteName: siteName,
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
