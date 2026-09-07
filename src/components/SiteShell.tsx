"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import { AdsterraSocialBar } from "@/components/ads/AdsterraSocialBar";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { isTechNewsDomain } from "@/components/sites/technews/theme";

// Lazy load domain-specific components with SSR enabled
const NewsIconsHeader = dynamic(() => import("./sites/newsicons/NewsIconsHeader"), { ssr: true });
const NewsIconsFooter = dynamic(() => import("./sites/newsicons/NewsIconsFooter"), { ssr: true });
const JejuTimeHeader = dynamic(() => import("./sites/jejutime/JejuTimeHeader"), { ssr: true });
const JejuTimeFooter = dynamic(() => import("./sites/jejutime/JejuTimeFooter"), { ssr: true });
const JejuQQHeader = dynamic(() => import("./sites/jejuqq/JejuQQHeader"), { ssr: true });
const JejuQQFooter = dynamic(() => import("./sites/jejuqq/JejuQQFooter"), { ssr: true });
const JejuJapanHeader = dynamic(() => import("./sites/jejujapan/JejuJapanHeader"), { ssr: true });
const JejuJapanFooter = dynamic(() => import("./sites/jejujapan/JejuJapanFooter"), { ssr: true });
const VoiceJejuHeader = dynamic<{ onOpenNewsletter?: () => void }>(() => import("@/components/sites/voicejeju/VoiceJejuHeader").then(m => m.VoiceJejuHeader), { ssr: true });
const VoiceJejuFooter = dynamic<{ onOpenNewsletter?: () => void; footerBanners?: import("@/components/sites/voicejeju/VoiceJejuFooter").Banner[] }>(() => import("@/components/sites/voicejeju/VoiceJejuFooter").then(m => m.VoiceJejuFooter), { ssr: true });
const SkyBluePrimeHeader = dynamic(() => import("./sites/skyblueprime/SkyBluePrimeHeader"), { ssr: true });
const SkyBluePrimeFooter = dynamic(() => import("./sites/skyblueprime/SkyBluePrimeFooter"), { ssr: true });
const LavagueTechHeader = dynamic(() => import("./sites/lavaguetech/LavagueTechHeader"), { ssr: true });
const LavagueTechFooter = dynamic(() => import("./sites/lavaguetech/LavagueTechFooter"), { ssr: true });
const LegalHyperHeader = dynamic<{ onOpenNewsletter?: () => void }>(() => import("@/components/sites/legalhyper/LegalHyperHeader").then(m => m.LegalHyperHeader), { ssr: true });
const LegalHyperFooter = dynamic<{ onOpenNewsletter?: () => void }>(() => import("@/components/sites/legalhyper/LegalHyperFooter").then(m => m.LegalHyperFooter), { ssr: true });
// technews tenant family — one per-domain component set each
type TechNewsChromeProps = { domain: string; onOpenNewsletter?: () => void };
const LinkTechNewsHeader = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/LinkTechNewsHeader"), { ssr: true });
const LinkTechNewsFooter = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/LinkTechNewsFooter"), { ssr: true });
const DbTechNewsHeader = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/DbTechNewsHeader"), { ssr: true });
const DbTechNewsFooter = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/DbTechNewsFooter"), { ssr: true });
const MagazineTechyHeader = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/MagazineTechyHeader"), { ssr: true });
const MagazineTechyFooter = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/MagazineTechyFooter"), { ssr: true });
const MagazineAirHeader = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/MagazineAirHeader"), { ssr: true });
const MagazineAirFooter = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/MagazineAirFooter"), { ssr: true });
const TechyGateHeader = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/TechyGateHeader"), { ssr: true });
const TechyGateFooter = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/TechyGateFooter"), { ssr: true });
const NewYorkSignalHeader = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/NewYorkSignalHeader"), { ssr: true });
const NewYorkSignalFooter = dynamic<TechNewsChromeProps>(() => import("@/components/sites/technews/NewYorkSignalFooter"), { ssr: true });

const TECHNEWS_HEADERS: Record<string, React.ComponentType<TechNewsChromeProps>> = {
  "linktechnews.com": LinkTechNewsHeader,
  "dbtechnews.com": DbTechNewsHeader,
  "magazinetechy.com": MagazineTechyHeader,
  "magazineair.com": MagazineAirHeader,
  "techygate.com": TechyGateHeader,
  "newyorksignal.com": NewYorkSignalHeader,
};
const TECHNEWS_FOOTERS: Record<string, React.ComponentType<TechNewsChromeProps>> = {
  "linktechnews.com": LinkTechNewsFooter,
  "dbtechnews.com": DbTechNewsFooter,
  "magazinetechy.com": MagazineTechyFooter,
  "magazineair.com": MagazineAirFooter,
  "techygate.com": TechyGateFooter,
  "newyorksignal.com": NewYorkSignalFooter,
};
function technewsKey(domain: string): string {
  const d = domain.toLowerCase().replace(/^www\./, "");
  return Object.keys(TECHNEWS_HEADERS).find((k) => d.includes(k.replace(/\.com$/, ""))) ?? "linktechnews.com";
}

// Fallbacks
const DefaultHeader = dynamic(() => import("./Header").then(m => m.Header), { ssr: true });
const DefaultFooter = dynamic(() => import("./Footer").then(m => m.Footer), { ssr: true });

interface SiteShellProps {
  children: React.ReactNode;
  domain: string;
}

export function SiteShell({ children, domain }: SiteShellProps) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const openNewsletter = () => setIsNewsletterOpen(true);
  const closeNewsletter = () => setIsNewsletterOpen(false);

  const site = useMemo(() => {
    const d = domain.toLowerCase();
    if (d.includes("voicejeju")) return "voicejeju";
    if (d.includes("jejutime")) return "jejutime";
    if (d.includes("jejuqq")) return "jejuqq";
    if (d.includes("jejujapan")) return "jejujapan";
    if (d.includes("newsicons")) return "newsicons";
    if (d.includes("skyblueprime")) return "skyblueprime";
    if (d.includes("lavaguetech")) return "lavaguetech";
    if (d.includes("legalhyper")) return "legalhyper";
    if (isTechNewsDomain(d)) return "technews";
    return "default";
  }, [domain]);

  const renderHeader = () => {
    switch (site) {
      case "voicejeju": return <VoiceJejuHeader onOpenNewsletter={openNewsletter} />;
      case "jejutime": return <JejuTimeHeader onOpenNewsletter={openNewsletter} />;
      case "jejuqq": return <JejuQQHeader onOpenNewsletter={openNewsletter} />;
      case "jejujapan": return <JejuJapanHeader onOpenNewsletter={openNewsletter} />;
      case "newsicons": return <NewsIconsHeader onOpenNewsletter={openNewsletter} />;
      case "skyblueprime": return <SkyBluePrimeHeader onOpenNewsletter={openNewsletter} />;
      case "lavaguetech": return <LavagueTechHeader onOpenNewsletter={openNewsletter} />;
      case "legalhyper": return <LegalHyperHeader onOpenNewsletter={openNewsletter} />;
      case "technews": {
        const H = TECHNEWS_HEADERS[technewsKey(domain)];
        return <H domain={domain} onOpenNewsletter={openNewsletter} />;
      }
      default: return <DefaultHeader onOpenNewsletter={openNewsletter} />;
    }
  };

  const renderFooter = () => {
    switch (site) {
      case "voicejeju": return <VoiceJejuFooter onOpenNewsletter={openNewsletter} />;
      case "jejutime": return <JejuTimeFooter onOpenNewsletter={openNewsletter} />;
      case "jejuqq": return <JejuQQFooter onOpenNewsletter={openNewsletter} />;
      case "jejujapan": return <JejuJapanFooter onOpenNewsletter={openNewsletter} />;
      case "newsicons": return <NewsIconsFooter onOpenNewsletter={openNewsletter} />;
      case "skyblueprime": return <SkyBluePrimeFooter onOpenNewsletter={openNewsletter} />;
      case "lavaguetech": return <LavagueTechFooter onOpenNewsletter={openNewsletter} />;
      case "legalhyper": return <LegalHyperFooter onOpenNewsletter={openNewsletter} />;
      case "technews": {
        const F = TECHNEWS_FOOTERS[technewsKey(domain)];
        return <F domain={domain} onOpenNewsletter={openNewsletter} />;
      }
      default: return <DefaultFooter onOpenNewsletter={openNewsletter} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <React.Suspense fallback={<div className="h-14 md:h-16 bg-white border-b border-gray-100" />}>
        {renderHeader()}
      </React.Suspense>
      {site === "newsicons" && (
        <div className="w-full flex justify-center py-3 border-b border-slate-200 overflow-hidden bg-white">
          <div className="hidden sm:block">
            <AdsterraBanner bannerKey={ADSTERRA_CONFIG.newsicons.banners["728x90"]} width={728} height={90} className="!my-0" />
          </div>
          <div className="block sm:hidden">
            <AdsterraBanner bannerKey={ADSTERRA_CONFIG.newsicons.banners["320x50"]} width={320} height={50} className="!my-0" />
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <React.Suspense fallback={<div className="h-48 bg-gray-50" />}>
        {renderFooter()}
      </React.Suspense>
      <NewsletterModal isOpen={isNewsletterOpen} onClose={closeNewsletter} domain={domain} />
      <AdsterraSocialBar domain={domain} />
    </div>
  );
}
