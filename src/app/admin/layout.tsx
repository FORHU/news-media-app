import { Metadata } from "next";
import { headers } from "next/headers";
import { normalizeHostToDomain, getSiteIconFromDomain, getSiteNameFromDomain } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");
  const domain = normalizeHostToDomain(host);
  const icon = getSiteIconFromDomain(domain);
  const siteName = getSiteNameFromDomain(domain);

  return {
    title: {
      default: `Admin | ${siteName}`,
      template: `%s | ${siteName} Admin`,
    },
    icons: {
      icon: icon,
    },
  };
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
