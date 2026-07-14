"use client";

import type { SocialPlatformConfig, SocialPlatformKey } from "@/config/socialPlatforms";

export function SocialPublishingTabs({
  platforms,
  activeKey,
  onChange,
}: {
  platforms: SocialPlatformConfig[];
  activeKey: SocialPlatformKey;
  onChange: (key: SocialPlatformKey) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isActive = platform.key === activeKey;
        return (
          <button
            key={platform.key}
            type="button"
            onClick={() => onChange(platform.key)}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
              isActive ? platform.tabActiveClass : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{platform.label}
          </button>
        );
      })}
    </div>
  );
}
