"use client";

import { useState, useMemo, useId, useEffect } from "react";
import { 
  Share2, 
  Link as LinkIcon, 
  Check,
} from "lucide-react";
import { 
  FaXTwitter, 
  FaFacebook, 
  FaFacebookMessenger, 
  FaWhatsapp, 
  FaLinkedin, 
  FaTelegram, 
  FaReddit 
} from "react-icons/fa6";
import { SiGmail } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FacebookShareButton } from "./FacebookShareButton";

type SiteTheme = "jejutime" | "jejuqq" | "jejujapan" | "newsicons";

function normalizeShareUrl(input: string) {
  try {
    const u = new URL(input);
    const isLocalhost =
      u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname.endsWith(".local");

    const forceWwwHosts = new Set([
      "jejujapan.com",
      "jejuqq.com",
      "jejutime.com",
      "newsicons.com",
    ]);

    // If user is browsing a real domain in dev (e.g. jejujapan.com:3000),
    // share the canonical public URL so Facebook can crawl it.
    if (!isLocalhost && u.port) {
      u.port = "";
      u.protocol = "https:";
    }

    // Normalize to www for known tenant domains.
    if (!isLocalhost) {
      const hostLower = u.hostname.toLowerCase();
      const withoutWww = hostLower.startsWith("www.") ? hostLower.slice(4) : hostLower;
      if (forceWwwHosts.has(withoutWww)) {
        u.hostname = `www.${withoutWww}`;
      }
    }

    // If protocol is http on a real domain, upgrade to https for sharing.
    if (!isLocalhost && u.protocol === "http:") {
      u.protocol = "https:";
    }

    return u.toString();
  } catch {
    return input;
  }
}

interface ArticleShareProps {
  title: string;
  url?: string;
  site: SiteTheme;
  className?: string;
}

// Colored Brand Icons Component
const BrandIcon = ({ name, className }: { name: string; className?: string }) => {
  const iconProps = { className: cn("w-full h-full transition-colors", className) };
  
  switch (name) {
    case "X (Twitter)":
      return <FaXTwitter {...iconProps} />;
    case "Facebook":
      return <FaFacebook {...iconProps} color="#1877F2" className={cn(iconProps.className, "group-hover:!text-white")} />;
    case "Messenger":
      return <FaFacebookMessenger {...iconProps} color="#00B2FF" className={cn(iconProps.className, "group-hover:!text-white")} />;
    case "WhatsApp":
      return <FaWhatsapp {...iconProps} color="#25D366" className={cn(iconProps.className, "group-hover:!text-white")} />;
    case "Gmail":
      return <SiGmail {...iconProps} color="#EA4335" className={cn(iconProps.className, "group-hover:!text-white")} />;
    case "LinkedIn":
      return <FaLinkedin {...iconProps} color="#0A66C2" className={cn(iconProps.className, "group-hover:!text-white")} />;
    case "Telegram":
      return <FaTelegram {...iconProps} color="#0088cc" className={cn(iconProps.className, "group-hover:!text-white")} />;
    case "Reddit":
      return <FaReddit {...iconProps} color="#FF4500" className={cn(iconProps.className, "group-hover:!text-white")} />;
    default:
      return null;
  }
};

export function ArticleShare({ title, url, site, className }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputId = useId();
  
  // Safely handle URL for hydration
  const [currentUrl, setCurrentUrl] = useState(url ? normalizeShareUrl(url) : "");

  useEffect(() => {
    setMounted(true);
    if (!url) {
      setCurrentUrl(normalizeShareUrl(window.location.href));
    }
  }, [url]);

  const shareUrl = currentUrl;

  const handleCopy = async () => {
    const copyToClipboard = async () => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      return false;
    };

    const fallbackCopy = () => {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        try {
          return document.execCommand("copy");
        } catch (err) {
          return false;
        }
      }
      return false;
    };

    const success = await copyToClipboard() || fallbackCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOptions = useMemo(() => [
    {
      name: "X (Twitter)",
      color: "hover:bg-black hover:text-white",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      color: "hover:bg-[#1877F2] hover:text-white",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Messenger",
      color: "hover:bg-[#00B2FF] hover:text-white",
      href: `https://www.facebook.com/dialog/send?app_id=121798348487900&link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      color: "hover:bg-[#25D366] hover:text-white",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + shareUrl)}`,
    },
    {
      name: "Gmail",
      color: "hover:bg-[#EA4335] hover:text-white",
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      color: "hover:bg-[#0A66C2] hover:text-white",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      color: "hover:bg-[#0088cc] hover:text-white",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: "Reddit",
      color: "hover:bg-[#FF4500] hover:text-white",
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
    },
  ], [title, shareUrl]);

  const getThemeStyles = () => {
    switch (site) {
      case "jejutime":
        return {
          trigger: "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 shadow-md transition-all font-roboto text-sm font-bold tracking-wide",
          modal: "sm:max-w-lg bg-white border-blue-50 rounded-3xl shadow-2xl",
          header: "text-blue-900 font-baskerville text-2xl font-bold",
          item: "rounded-2xl border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all",
          copyBtn: "bg-slate-50 hover:bg-blue-50 text-blue-600 border-slate-100",
        };
      case "jejuqq":
        return {
          trigger: "bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-none px-8 py-3 transition-colors font-garamond text-lg font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          modal: "sm:max-w-lg bg-[#fdf2f2] border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
          header: "text-black font-garamond text-3xl font-black uppercase tracking-tight",
          item: "rounded-none border-2 border-black hover:bg-white transition-all",
          copyBtn: "bg-white hover:bg-black hover:text-white text-black border-2 border-black rounded-none",
        };
      case "jejujapan":
        return {
          trigger: "bg-black hover:bg-[#bc002d] text-white rounded-none px-8 py-2 transition-colors font-noto text-sm font-black uppercase tracking-[0.2em]",
          modal: "sm:max-w-lg bg-white border-4 border-black rounded-none",
          header: "text-black font-noto text-2xl font-black uppercase tracking-widest",
          item: "rounded-none border-black hover:border-[#bc002d] transition-all",
          copyBtn: "bg-black text-white hover:bg-[#bc002d] rounded-none border-none",
        };
      case "newsicons":
      default:
        return {
          trigger: "bg-[#ff4500] hover:bg-[#e03d00] text-white rounded-xl px-6 py-2 shadow-sm transition-colors font-sans text-sm font-semibold",
          modal: "sm:max-w-lg bg-white rounded-2xl shadow-xl",
          header: "text-gray-900 font-bold text-xl",
          item: "rounded-xl border-gray-100 hover:bg-gray-50 transition-colors",
          copyBtn: "bg-gray-100 hover:bg-gray-200 text-gray-900 border-none",
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={cn("mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-6", className)}>
      <p className={cn(
        "text-xs font-bold uppercase tracking-[0.2em]",
        site === "jejutime" ? "text-blue-600/60" : 
        site === "jejuqq" ? "text-[#b91c1c] font-garamond text-sm" : 
        site === "jejujapan" ? "text-black/40 font-noto" : "text-gray-400"
      )}>
        {site === "jejuqq" ? "Share the Story" : site === "jejujapan" ? "SHARE" : "Share this article"}
      </p>

      <Dialog>
        <DialogTrigger asChild>
          <Button className={styles.trigger}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Article
          </Button>
        </DialogTrigger>
        <DialogContent className={cn(styles.modal, "max-w-[95vw] sm:max-w-lg")}>
          <DialogHeader>
            <DialogTitle className={styles.header}>
              Share this Story
            </DialogTitle>
          </DialogHeader>

          {/* Hidden input for copying - more reliable than dynamic creation */}
          <input 
            id={inputId}
            type="text"
            readOnly
            value={shareUrl}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full">
            {shareOptions.map((option) =>
              option.name === "Facebook" ? (
                <FacebookShareButton
                  key={option.name}
                  articleUrl={shareUrl}
                  className={cn(
                    "flex items-center gap-3 p-3 border text-sm font-medium transition-colors group w-full min-w-0 overflow-hidden",
                    styles.item,
                    option.color
                  )}
                >
                  <BrandIcon
                    name={option.name}
                    className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                  />
                  <span className="truncate">{option.name}</span>
                </FacebookShareButton>
              ) : (
                <a
                  key={option.name}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share on ${option.name}`}
                  className={cn(
                    "flex items-center gap-3 p-3 border text-sm font-medium transition-colors group w-full min-w-0 overflow-hidden",
                    styles.item,
                    option.color
                  )}
                >
                  <BrandIcon
                    name={option.name}
                    className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                  />
                  <span className="truncate">{option.name}</span>
                </a>
              )
            )}
          </div>

          <div className="mt-6 w-full overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Or copy link</p>
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-500 truncate font-mono min-w-0">
                {shareUrl}
              </div>
              <Button
                onClick={handleCopy}
                className={cn("shrink-0", styles.copyBtn)}
                size="sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
