"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, Copy, Check } from "lucide-react";

const EMAIL = "socials@forhu.ai";

type Theme = "default" | "voicejeju" | "jejutime" | "skyblueprime";

const themeStyles: Record<Theme, {
  container: string;
  emailText: string;
  mailIcon: string;
  copyBtn: string;
  sendBtn: string;
}> = {
  default: {
    container: "bg-white border border-gray-200 rounded-xl shadow-xl",
    emailText: "text-gray-700",
    mailIcon: "text-gray-400",
    copyBtn: "hover:bg-gray-100 text-gray-400 hover:text-gray-700",
    sendBtn: "bg-gray-900 hover:bg-black text-white rounded-lg",
  },
  voicejeju: {
    container: "bg-zinc-900 border border-white/10 rounded-none shadow-xl",
    emailText: "text-zinc-300",
    mailIcon: "text-zinc-500",
    copyBtn: "hover:bg-white/10 text-zinc-500 hover:text-zinc-200",
    sendBtn: "bg-white hover:bg-zinc-100 text-black rounded-none",
  },
  jejutime: {
    container: "bg-white border border-blue-100 rounded-none shadow-md",
    emailText: "text-slate-700",
    mailIcon: "text-blue-400",
    copyBtn: "hover:bg-blue-50 text-blue-300 hover:text-blue-600",
    sendBtn: "bg-blue-600 hover:bg-blue-700 text-white rounded-none",
  },
  skyblueprime: {
    container: "bg-sky-900 border border-sky-700 rounded-xl shadow-xl",
    emailText: "text-sky-100",
    mailIcon: "text-sky-400",
    copyBtn: "hover:bg-sky-800 text-sky-400 hover:text-white",
    sendBtn: "bg-sky-500 hover:bg-sky-400 text-white rounded-xl",
  },
};

interface ContactEmailButtonProps {
  wrapperClassName?: string;
  buttonClassName?: string;
  iconSize?: number;
  iconClassName?: string;
  strokeWidth?: number;
  showLabel?: boolean;
  showIcon?: boolean;
  labelText?: string;
  inline?: boolean;
  theme?: Theme;
}

export default function ContactEmailButton({
  wrapperClassName,
  buttonClassName,
  iconSize = 20,
  iconClassName,
  strokeWidth,
  showLabel = false,
  showIcon = true,
  labelText = "Contact Us",
  inline = false,
  theme = "default",
}: ContactEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const styles = themeStyles[theme];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this email address:", EMAIL);
    }
  };

  return (
    <div ref={ref} className={`relative${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
        aria-label="Contact email"
      >
        {showIcon && (
          <Mail size={iconSize} strokeWidth={strokeWidth} className={iconClassName} />
        )}
        {showLabel && <span>{labelText}</span>}
      </button>

      {open && (
        <div className={`${inline ? "mt-3" : "absolute right-0 top-full mt-2 z-50"} ${styles.container} p-4 flex flex-col gap-3 whitespace-nowrap min-w-[220px]`}>
          <div className="flex items-center gap-2">
            <Mail size={14} className={`${styles.mailIcon} shrink-0`} />
            <span className={`text-sm font-medium ${styles.emailText} flex-1`}>{EMAIL}</span>
            <button
              type="button"
              onClick={copyEmail}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${styles.copyBtn}`}
              aria-label={copied ? "Copied!" : "Copy email"}
              title={copied ? "Copied!" : "Copy email"}
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>
          <a
            href={`mailto:${EMAIL}`}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold transition-colors ${styles.sendBtn}`}
          >
            <Mail size={13} />
            Send Email
          </a>
        </div>
      )}
    </div>
  );
}
