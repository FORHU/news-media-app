import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  // You can switch headers/footers here based on the domain
  // if (domain === "jejutime.com") return <JejuTimeLayout>{children}</JejuTimeLayout>

  return (
    <>
      {/* Site-specific wrapper or CSS classes could go here */}
      <div className={`site-theme-${domain.replace(".", "-")}`}>
        {children}
      </div>
      {/* 
         If you move the NavBar here, remove it from individual pages.
         For now, keeping it in pages to match existing structure.
      */}
    </>
  );
}
