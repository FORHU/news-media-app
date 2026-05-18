"use client";

import Script from "next/script";

export function AdsterraNativeBanner() {
  return (
    <div className="w-full my-8 bg-white p-6 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-xl">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 text-center">
        Sponsored Recommendations
      </div>

      {/* Container that Adsterra targets with its invoke.js */}
      <div
        id="container-055aa9559be0d3784216da85175a7203"
        className="min-h-[250px] w-full"
      />

      {/* Load after page is interactive — avoids blocking LCP */}
      <Script
        async
        data-cfasync="false"
        src="https://pl29482512.effectivecpmnetwork.com/055aa9559be0d3784216da85175a7203/invoke.js"
        strategy="lazyOnload"
      />
    </div>
  );
}
