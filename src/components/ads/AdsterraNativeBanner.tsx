"use client";

import { useState, useEffect, useRef } from "react";
import { ADSTERRA_CONFIG, getAdsterraTenant } from "@/config/adsterra";

interface AdsterraNativeBannerProps {
  domain?: string;
  transparent?: boolean;
}

export function AdsterraNativeBanner({ domain: propDomain, transparent }: AdsterraNativeBannerProps) {
  const [resolvedDomain, setResolvedDomain] = useState<string>("");
  const [iframeWidth, setIframeWidth] = useState(0);
  const [iframeHeight, setIframeHeight] = useState(300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Resolve domain: propDomain mirror happens during render (no effect needed);
  // the window.location fallback genuinely needs an effect (client-only DOM access).
  const [prevPropDomain, setPrevPropDomain] = useState(propDomain);
  if (propDomain !== prevPropDomain) {
    setPrevPropDomain(propDomain);
    if (propDomain) setResolvedDomain(propDomain);
  }

  useEffect(() => {
    if (propDomain) return;
    const hostname = window.location.hostname.toLowerCase();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hostname.includes("voicejeju")) setResolvedDomain("voicejeju.com");
    else if (hostname.includes("jejujapan")) setResolvedDomain("jejujapan.com");
    else if (hostname.includes("jejuqq")) setResolvedDomain("jejuqq.com");
    else if (hostname.includes("skyblueprime")) setResolvedDomain("skyblueprime.com");
    else if (hostname.includes("newsicons")) setResolvedDomain("newsicons.com");
    else setResolvedDomain("jejutime.com");
  }, [propDomain]);

  // Watch container width with a debounced ResizeObserver so the iframe
  // remounts with the correct pixel width on every viewport change
  // (desktop ↔ mobile toggle, orientation change, window resize).
  useEffect(() => {
    if (!wrapperRef.current) return;
    let timer: ReturnType<typeof setTimeout>;

    const measure = () => {
      if (!wrapperRef.current) return;
      const w = wrapperRef.current.offsetWidth - 32; // subtract p-4 (16px × 2)
      if (w > 0) {
        setIframeWidth((prev) => {
          if (prev !== w) setIframeHeight(300); // reset height for new layout
          return w;
        });
      }
    };

    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 250);
    });
    ro.observe(wrapperRef.current);
    measure(); // initial measurement

    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  // Height listener — only grow, never shrink, to prevent the collapse loop.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "adsterra-native-height" && typeof e.data.height === "number" && e.data.height > 50) {
        setIframeHeight((prev) => Math.max(prev, e.data.height + 8));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const tenant = resolvedDomain ? getAdsterraTenant(resolvedDomain) : "jejutime";
  const config = ADSTERRA_CONFIG[tenant]?.native;

  // Build srcDoc only when we have a stable pixel width so Adsterra picks the
  // right column count on first render (4-col on desktop, 1-col on mobile).
  const html = iframeWidth > 0 && config ? `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${iframeWidth}px; overflow: hidden; background: transparent; font-family: sans-serif; }
      #${config.containerId} { width: ${iframeWidth}px; }
    </style>
  </head>
  <body>
    <div id="${config.containerId}"></div>
    <script async data-cfasync="false" src="${config.src}"><\/script>
    <script>
      function reportHeight() {
        var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (h > 50) window.parent.postMessage({ type: 'adsterra-native-height', height: h }, '*');
      }
      if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.body);
      new MutationObserver(reportHeight).observe(document.body, { childList: true, subtree: true });
      window.addEventListener('load', reportHeight);
    <\/script>
  </body>
</html>` : "";

  return (
    <div
      ref={wrapperRef}
      className={`w-full my-2 p-4 ${transparent ? "bg-transparent border-0 shadow-none" : "bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-xl"}`}
    >
      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-3 text-center">
        Sponsored Recommendations
      </div>
      {iframeWidth > 0 && (
        <iframe
          key={iframeWidth}
          srcDoc={html}
          width={iframeWidth}
          height={iframeHeight}
          frameBorder="0"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin"
          style={{ border: "none", width: "100%", display: "block", transition: "height 0.15s ease" }}
          title="Sponsored Recommendations"
        />
      )}
    </div>
  );
}

