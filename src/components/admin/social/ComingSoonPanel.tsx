import type { SocialPlatformConfig } from "@/config/socialPlatforms";

export function ComingSoonPanel({ platform }: { platform: SocialPlatformConfig }) {
  const Icon = platform.icon;
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center bg-white rounded-2xl border border-gray-100">
      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${platform.iconContainerClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm font-black uppercase tracking-widest text-gray-400">Coming Soon</p>
      <p className="text-xs text-gray-400 max-w-xs">
        {platform.label} publishing isn&apos;t wired up yet — this tab is a placeholder.
      </p>
    </div>
  );
}
