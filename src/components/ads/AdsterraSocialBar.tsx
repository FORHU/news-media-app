"use client";

import Script from "next/script";
import { ADSTERRA_CONFIG, getAdsterraTenant } from "@/config/adsterra";

interface AdsterraSocialBarProps {
  domain: string;
}

export function AdsterraSocialBar({ domain }: AdsterraSocialBarProps) {
  const tenant = getAdsterraTenant(domain);
  const socialBarSrc = ADSTERRA_CONFIG[tenant]?.socialBar;

  if (!socialBarSrc) return null;

  return <Script src={socialBarSrc} strategy="lazyOnload" />;
}
