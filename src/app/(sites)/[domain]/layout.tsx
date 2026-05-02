import { SiteShell } from "@/components/SiteShell";
import { resolveTenantIdFromDomain } from "@/lib/tenant";
import { bannersService } from "@/services/banners.service";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const tenantId = await resolveTenantIdFromDomain(domain);

  // Fetch footer banners once for the entire site
  const footerBanners = tenantId
    ? await bannersService
        .getBanners({ position: "GLOBAL_FOOTER", isActive: true, tenantId })
        .catch(() => [])
    : [];

  return (
    <div className={`site-theme-${domain.replace(".", "-")}`}>
      <SiteShell domain={domain} footerBanners={footerBanners}>
        {children}
      </SiteShell>
    </div>
  );
}
