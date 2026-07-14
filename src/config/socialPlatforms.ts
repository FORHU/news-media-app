import type { LucideIcon } from "lucide-react";
import { Facebook, Instagram } from "lucide-react";

export type SocialPlatformKey = "facebook" | "instagram";

export type SocialPlatformConfig = {
  key: SocialPlatformKey;
  label: string;
  icon: LucideIcon;
  description: string;
  // Full Tailwind class strings kept as literals (not built at runtime) so the
  // JIT compiler can statically discover and generate them.
  iconContainerClass: string;
  tabActiveClass: string;
  accentTextClass: string;
  accentButtonClass: string;
  // null = no backend wired up yet; the UI falls back to a "coming soon" panel.
  apiBasePath: string | null;
};

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    description: "Select published articles to post to the company Facebook Page",
    iconContainerClass: "bg-gradient-to-br from-[#1877F2] to-[#0c5dc7] shadow-blue-500/20",
    tabActiveClass: "bg-white text-[#1877F2] shadow-sm",
    accentTextClass: "text-[#1877F2]",
    accentButtonClass: "bg-[#1877F2] hover:bg-[#0c5dc7]",
    apiBasePath: "/api/admin/facebook",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    description: "Select published articles to post to the company Instagram account",
    iconContainerClass: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] shadow-pink-500/20",
    tabActiveClass: "bg-white text-[#E1306C] shadow-sm",
    accentTextClass: "text-[#E1306C]",
    accentButtonClass: "bg-[#E1306C] hover:bg-[#c1275a]",
    apiBasePath: "/api/admin/instagram",
  },
];
