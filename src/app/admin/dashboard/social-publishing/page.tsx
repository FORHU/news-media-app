"use client";

import { useState } from "react";
import { SOCIAL_PLATFORMS, type SocialPlatformKey } from "@/config/socialPlatforms";
import { SocialPublishingTabs } from "@/components/admin/social/SocialPublishingTabs";
import { SocialPublishingPanel } from "@/components/admin/social/SocialPublishingPanel";
import { ComingSoonPanel } from "@/components/admin/social/ComingSoonPanel";

export default function SocialPublishingPage() {
  const [activeKey, setActiveKey] = useState<SocialPlatformKey>("facebook");
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === activeKey) ?? SOCIAL_PLATFORMS[0];
  const Icon = platform.icon;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${platform.iconContainerClass}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Social Publishing</h1>
          <p className="text-gray-500 text-sm font-medium">{platform.description}</p>
        </div>
      </div>

      <SocialPublishingTabs platforms={SOCIAL_PLATFORMS} activeKey={activeKey} onChange={setActiveKey} />

      {platform.apiBasePath ? (
        <SocialPublishingPanel key={platform.key} platform={platform} apiBasePath={platform.apiBasePath} />
      ) : (
        <ComingSoonPanel platform={platform} />
      )}
    </div>
  );
}
