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

  return (
    <div className={`site-theme-${domain.replace(".", "-")}`}>
      <SiteShell domain={domain}>
        {children}
      </SiteShell>
    </div>
  );
}
