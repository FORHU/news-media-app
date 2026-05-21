"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ADSTERRA_CONFIG, getAdsterraTenant } from "@/config/adsterra";

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
      } else if (hostname.includes("jejujapan")) {
        setResolvedDomain("jejujapan.com");
      } else if (hostname.includes("jejuqq")) {
        setResolvedDomain("jejuqq.com");
      } else if (hostname.includes("skyblueprime")) {
        setResolvedDomain("skyblueprime.com");
      } else {
        setResolvedDomain("jejutime.com");
      }
    }
  }, [propDomain]);

  const tenant = resolvedDomain ? getAdsterraTenant(resolvedDomain) : "jejutime";
  const config = ADSTERRA_CONFIG[tenant]?.native;

  useEffect(() => {
    if (!config || !resolvedDomain) return;

    // Clear any existing content in the container first to prevent duplicates or stale states
    const container = document.getElementById(config.containerId);
    if (container) {
      container.innerHTML = "";
    }

    // Programmatically create and append the script tag directly inside the container
    const script = document.createElement("script");
    script.src = config.src;
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    container?.appendChild(script);

    return () => {
      // Clean up when unmounting
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [config?.containerId, config?.src, resolvedDomain]);

  if (!resolvedDomain || !config) return null;

  return (
    <div className="w-full my-2 bg-white p-4 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-xl">
      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-3 text-center">
        Sponsored Recommendations
      </div>

      {/* Container that Adsterra targets with its invoke.js */}
      <div
        id={config.containerId}
        className="min-h-[250px] w-full"
      />
    </div>
  );
}

