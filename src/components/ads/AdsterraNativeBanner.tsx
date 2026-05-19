"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface AdsterraNativeBannerProps {
  domain?: string;
}

export function AdsterraNativeBanner({ domain: propDomain }: AdsterraNativeBannerProps) {
  const [resolvedDomain, setResolvedDomain] = useState<string>("");

  useEffect(() => {
    if (propDomain) {
      setResolvedDomain(propDomain);
    } else {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.includes("voicejeju")) {
        setResolvedDomain("voicejeju.com");
      } else {
        setResolvedDomain("jejutime.com");
      }
    }
  }, [propDomain]);

  if (!resolvedDomain) return null;

  const isVoiceJeju = resolvedDomain.includes("voicejeju");

  const config = isVoiceJeju
    ? {
        containerId: "container-9c5ecdec78c05c286aa87cb118bfee5b",
        src: "https://pl29489864.effectivecpmnetwork.com/9c5ecdec78c05c286aa87cb118bfee5b/invoke.js",
      }
    : {
        containerId: "container-055aa9559be0d3784216da85175a7203",
        src: "https://pl29482512.effectivecpmnetwork.com/055aa9559be0d3784216da85175a7203/invoke.js",
      };

  return (
    <div className="w-full my-2 bg-white p-4 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-xl">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 text-center">
        Sponsored Recommendations
      </div>

      {/* Container that Adsterra targets with its invoke.js */}
      <div
        id={config.containerId}
        className="min-h-[250px] w-full"
      />

      {/* Load after page is interactive — avoids blocking LCP */}
      <Script
        async
        data-cfasync="false"
        src={config.src}
        strategy="lazyOnload"
      />
    </div>
  );
}
