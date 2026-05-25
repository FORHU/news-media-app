"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, Copy, Check } from "lucide-react";

const EMAIL = "socials@forhu.ai";

interface ContactEmailButtonProps {
  wrapperClassName?: string;
  buttonClassName?: string;
  iconSize?: number;
  iconClassName?: string;
  strokeWidth?: number;
  showLabel?: boolean;
  showIcon?: boolean;
  labelText?: string;
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
}: ContactEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex flex-col gap-3 whitespace-nowrap min-w-[220px]">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-700 flex-1">{EMAIL}</span>
            <button
              type="button"
              onClick={copyEmail}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 shrink-0"
              aria-label={copied ? "Copied!" : "Copy email"}
              title={copied ? "Copied!" : "Copy email"}
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Mail size={13} />
            Send Email
          </a>
        </div>
      )}
    </div>
  );
}
