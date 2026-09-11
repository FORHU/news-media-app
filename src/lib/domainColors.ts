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
  "legalhyper.com": {
    hex: "#8A6A22",
    bgClass: "bg-[#8A6A22]",
    textClass: "text-[#8A6A22]",
    borderClass: "border-[#8A6A22]",
    hoverBgClass: "hover:bg-[#6f5419]",
    ringClass: "focus:ring-[#8A6A22]/20",
  },
  "linktechnews.com": {
    hex: "#3B39E4",
    bgClass: "bg-[#3B39E4]",
    textClass: "text-[#3B39E4]",
    borderClass: "border-[#3B39E4]",
    hoverBgClass: "hover:bg-[#302ec2]",
    ringClass: "focus:ring-[#3B39E4]/20",
  },
  "dbtechnews.com": {
    hex: "#2F6FEB",
    bgClass: "bg-[#2F6FEB]",
    textClass: "text-[#2F6FEB]",
    borderClass: "border-[#2F6FEB]",
    hoverBgClass: "hover:bg-[#245bc4]",
    ringClass: "focus:ring-[#2F6FEB]/20",
  },
  "magazinetechy.com": {
    hex: "#D81E5B",
    bgClass: "bg-[#D81E5B]",
    textClass: "text-[#D81E5B]",
    borderClass: "border-[#D81E5B]",
    hoverBgClass: "hover:bg-[#b8194d]",
    ringClass: "focus:ring-[#D81E5B]/20",
  },
  "magazineair.com": {
    hex: "#227D96",
    bgClass: "bg-[#227D96]",
    textClass: "text-[#227D96]",
    borderClass: "border-[#227D96]",
    hoverBgClass: "hover:bg-[#1b657a]",
    ringClass: "focus:ring-[#227D96]/20",
  },
  "techygate.com": {
    hex: "#F1530A",
    bgClass: "bg-[#F1530A]",
    textClass: "text-[#F1530A]",
    borderClass: "border-[#F1530A]",
    hoverBgClass: "hover:bg-[#cf4508]",
    ringClass: "focus:ring-[#F1530A]/20",
  },
  "newyorksignal.com": {
    hex: "#7C231E",
    bgClass: "bg-[#7C231E]",
    textClass: "text-[#7C231E]",
    borderClass: "border-[#7C231E]",
    hoverBgClass: "hover:bg-[#661c18]",
    ringClass: "focus:ring-[#7C231E]/20",
  },
  "techoggi.com": {
    hex: "#0EA968",
    bgClass: "bg-[#0EA968]",
    textClass: "text-[#0EA968]",
    borderClass: "border-[#0EA968]",
    hoverBgClass: "hover:bg-[#0C8C55]",
    ringClass: "focus:ring-[#0EA968]/20",
  },
};

export function getDomainColor(domain: string = ""): DomainColor {
  const normalized = domain.toLowerCase();

  if (normalized.includes("voicejeju")) return DOMAIN_COLORS["voicejeju.com"];
  if (normalized.includes("jejutime")) return DOMAIN_COLORS["jejutime.com"];
  if (normalized.includes("jejuqq")) return DOMAIN_COLORS["jejuqq.com"];
  if (normalized.includes("jejujapan")) return DOMAIN_COLORS["jejujapan.com"];
  if (normalized.includes("skyblueprime")) return DOMAIN_COLORS["skyblueprime.com"];
  if (normalized.includes("legalhyper")) return DOMAIN_COLORS["legalhyper.com"];
  if (normalized.includes("linktechnews")) return DOMAIN_COLORS["linktechnews.com"];
  if (normalized.includes("dbtechnews")) return DOMAIN_COLORS["dbtechnews.com"];
  if (normalized.includes("magazinetechy")) return DOMAIN_COLORS["magazinetechy.com"];
  if (normalized.includes("magazineair")) return DOMAIN_COLORS["magazineair.com"];
  if (normalized.includes("techygate")) return DOMAIN_COLORS["techygate.com"];
  if (normalized.includes("newyorksignal")) return DOMAIN_COLORS["newyorksignal.com"];
  if (normalized.includes("techoggi")) return DOMAIN_COLORS["techoggi.com"];

  // Default to NewsIcons
  return DOMAIN_COLORS["newsicons.com"];
}
