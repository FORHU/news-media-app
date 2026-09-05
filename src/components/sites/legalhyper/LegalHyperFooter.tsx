"use client"; // LegalHyper Footer ("The Legal Review" design)

import Link from "next/link";
import { useState } from "react";

interface FooterProps {
  onOpenNewsletter?: () => void;
}

export function LegalHyperFooter({ onOpenNewsletter }: FooterProps) {
  const [briefingEmail, setBriefingEmail] = useState("");

  return (
    <footer className="font-chivo" style={{ background: "#0B1424", color: "#C6CBD6" }}>
      <div
        className="max-w-[1320px] mx-auto px-4 sm:px-7 py-14 grid gap-10"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
      >
        <div>
          <div className="font-bodoni uppercase" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "0.04em", color: "#F4F0E6", lineHeight: 1 }}>
            LegalHyper
          </div>
          <div className="mt-2 text-[9.5px] uppercase" style={{ letterSpacing: "0.3em", color: "#8E97A8" }}>
            Legal AI · LegalTech · Policy
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed max-w-[34ch]" style={{ color: "#8E97A8" }}>
            Independent journalism on the AI transforming the practice of law — from the courtroom to the boardroom.
          </p>
        </div>

        <div>
          <div
            className="text-[10px] uppercase pb-3"
            style={{ letterSpacing: "0.26em", color: "#B08D3F", borderBottom: "1px solid #26314A" }}
          >
            Publication
          </div>
          <div className="flex flex-col gap-2.5 pt-3.5 text-[14px]">
            <Link href="/" className="hover:text-[#B08D3F] transition-colors" style={{ color: "#C6CBD6" }}>About</Link>
            <span className="opacity-70">Editorial Policy</span>
            <ContactLink />
            <span className="opacity-70">Careers</span>
          </div>
        </div>

        <div>
          <div
            className="text-[10px] uppercase pb-3"
            style={{ letterSpacing: "0.26em", color: "#B08D3F", borderBottom: "1px solid #26314A" }}
          >
            Legal
          </div>
          <div className="flex flex-col gap-2.5 pt-3.5 text-[14px]">
            <span className="opacity-70">Advertise</span>
            <span className="opacity-70">Privacy Policy</span>
            <span className="opacity-70">Terms</span>
            <span className="opacity-70">Corrections</span>
          </div>
        </div>

        <div>
          <div
            className="text-[10px] uppercase pb-3"
            style={{ letterSpacing: "0.26em", color: "#B08D3F", borderBottom: "1px solid #26314A" }}
          >
            Follow
          </div>
          <div className="flex flex-col gap-2.5 pt-3.5 text-[14px]">
            <span className="opacity-70">X / Twitter</span>
            <span className="opacity-70">LinkedIn</span>
            <span className="opacity-70">RSS</span>
          </div>
        </div>

        <div>
          <div
            className="text-[10px] uppercase pb-3"
            style={{ letterSpacing: "0.26em", color: "#B08D3F", borderBottom: "1px solid #26314A" }}
          >
            Daily Briefing
          </div>
          <p className="text-[13.5px] leading-snug my-3.5" style={{ color: "#8E97A8" }}>
            One email each morning, before the markets open.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onOpenNewsletter?.();
              setBriefingEmail("");
            }}
            className="flex gap-2 flex-wrap"
          >
            <input
              value={briefingEmail}
              onChange={(e) => setBriefingEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px]"
              style={{ border: "1px solid #26314A", padding: "11px 12px", color: "#F4F0E6" }}
            />
            <button
              type="submit"
              className="shrink-0 text-[10.5px] font-semibold uppercase"
              style={{ background: "#B08D3F", color: "#0B1424", border: "none", padding: "11px 16px", letterSpacing: "0.14em" }}
            >
              Join
            </button>
          </form>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1B2740" }}>
        <div
          className="max-w-[1320px] mx-auto px-4 sm:px-7 py-6 flex flex-wrap gap-3 justify-between text-[11.5px]"
          style={{ letterSpacing: "0.08em", color: "#77839A" }}
        >
          <div>© 2026 LegalHyper Publishing. All rights reserved.</div>
          <div>Independent legal AI journalism.</div>
        </div>
      </div>
    </footer>
  );
}

function ContactLink() {
  return (
    <a href="mailto:socials@forhu.ai" className="hover:text-[#B08D3F] transition-colors" style={{ color: "#C6CBD6" }}>
      Contact
    </a>
  );
}
