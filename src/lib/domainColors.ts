export type DomainColor = {
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  hoverBgClass: string;
  ringClass: string;
};

export const DOMAIN_COLORS: Record<string, DomainColor> = {
  "voicejeju.com": {
    hex: "#000000",
    bgClass: "bg-black",
    textClass: "text-black",
    borderClass: "border-black",
    hoverBgClass: "hover:bg-gray-900",
    ringClass: "focus:ring-black/20",
  },
  "jejutime.com": {
    hex: "#2563eb",
    bgClass: "bg-[#2563eb]",
    textClass: "text-[#2563eb]",
    borderClass: "border-[#2563eb]",
    hoverBgClass: "hover:bg-[#1d4ed8]",
    ringClass: "focus:ring-[#2563eb]/20",
  },
  "jejuqq.com": {
    hex: "#dc2626",
    bgClass: "bg-[#dc2626]",
    textClass: "text-[#dc2626]",
    borderClass: "border-[#dc2626]",
    hoverBgClass: "hover:bg-[#b91c1c]",
    ringClass: "focus:ring-[#dc2626]/20",
  },
  "jejujapan.com": {
    hex: "#bc002d",
    bgClass: "bg-[#bc002d]",
    textClass: "text-[#bc002d]",
    borderClass: "border-[#bc002d]",
    hoverBgClass: "hover:bg-[#9a0025]",
    ringClass: "focus:ring-[#bc002d]/20",
  },
  "newsicons.com": {
    hex: "#ff4500",
    bgClass: "bg-[#ff4500]",
    textClass: "text-[#ff4500]",
    borderClass: "border-[#ff4500]",
    hoverBgClass: "hover:bg-[#e03d00]",
    ringClass: "focus:ring-[#ff4500]/20",
  },
  "skyblueprime.com": {
    hex: "#0284c7",
    bgClass: "bg-sky-600",
    textClass: "text-sky-600",
    borderClass: "border-sky-600",
    hoverBgClass: "hover:bg-sky-700",
    ringClass: "focus:ring-sky-600/20",
  },
};

export function getDomainColor(domain: string = ""): DomainColor {
  const normalized = domain.toLowerCase();
  
  if (normalized.includes("voicejeju")) return DOMAIN_COLORS["voicejeju.com"];
  if (normalized.includes("jejutime")) return DOMAIN_COLORS["jejutime.com"];
  if (normalized.includes("jejuqq")) return DOMAIN_COLORS["jejuqq.com"];
  if (normalized.includes("jejujapan")) return DOMAIN_COLORS["jejujapan.com"];
  if (normalized.includes("skyblueprime")) return DOMAIN_COLORS["skyblueprime.com"];
  
  // Default to NewsIcons
  return DOMAIN_COLORS["newsicons.com"];
}
