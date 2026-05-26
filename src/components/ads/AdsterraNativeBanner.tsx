"use client";

import { useState, useEffect } from "react";
import { ADSTERRA_CONFIG, getAdsterraTenant } from "@/config/adsterra";

interface AdsterraNativeBannerProps {
  domain?: string;
  transparent?: boolean;
}

export function AdsterraNativeBanner({ domain: propDomain, transparent }: AdsterraNativeBannerProps) {
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

  if (!resolvedDomain || !config) return null;

  // Run the native ad script inside a sandboxed iframe so it cannot open
  // pop-ups or pop-unders on the parent page (window.open is blocked by the
  // sandbox; allow-scripts lets the ad render; allow-same-origin lets it read
  // its own cookies for frequency capping).
  const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: transparent; font-family: sans-serif; }
    </style>
  </head>
  <body>
    <div id="${config.containerId}"></div>
    <script async data-cfasync="false" src="${config.src}"><\/script>
  </body>
</html>`;

  return (
    <div className={`w-full my-2 p-4 ${transparent ? "bg-transparent border-0 shadow-none" : "bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-xl"}`}>
      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-3 text-center">
        Sponsored Recommendations
      </div>
      <iframe
        srcDoc={html}
        width="100%"
        height="300"
        frameBorder="0"
        scrolling="no"
        // allow-scripts: ad JS can run; allow-same-origin: cookies work
        // NOT allowing allow-popups or allow-top-navigation → no pop-ups
        sandbox="allow-scripts allow-same-origin"
        style={{ border: "none", width: "100%", minHeight: 250, display: "block" }}
        title="Sponsored Recommendations"
      />
    </div>
  );
}

