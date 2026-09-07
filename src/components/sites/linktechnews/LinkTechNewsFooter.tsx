"use client";

import Link from "next/link";
import { Mail, Globe } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { getCoreCategories } from "@/config/categories";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { Wordmark, SectionLabel } from "../technews-shared/parts";

export default function LinkTechNewsFooter({
  domain,
  onOpenNewsletter,
}: {
  domain: string;
  onOpenNewsletter?: () => void;
}) {
  const theme = getTechNewsTheme(domain);
  const categories = getCoreCategories(domain);
  if (!theme) return null;

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 w-full mt-8 mb-4">
        <AdBanner position="GLOBAL_FOOTER" />
      </div>
      <footer
        style={techNewsVars(theme)}
        className="bg-[var(--tn-ink)] text-[var(--tn-bg)] pt-14 pb-8"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-4">
              <Link href="/" className="inline-block mb-4 [&_*]:!text-[var(--tn-bg)]">
                <Wordmark theme={theme} className="text-xl" />
              </Link>
              <p className="mt-3 text-sm text-white/70 leading-relaxed max-w-sm">{theme.tagline}</p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/"
                  aria-label={theme.domain}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <Globe size={16} />
                </Link>
                <a
                  href="mailto:socials@forhu.ai"
                  aria-label="Contact"
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            <div className="md:col-span-2">
              <SectionLabel theme={theme} className="mb-4 [&_*]:!text-white/50 !text-white/50">
                Sections
              </SectionLabel>
              <ul className="space-y-3 text-sm text-white/70">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">All Stories</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Archive</Link></li>
                <li><a href="mailto:socials@forhu.ai" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <SectionLabel theme={theme} className="mb-4 [&_*]:!text-white/50 !text-white/50">
                Topics
              </SectionLabel>
              <ul className="space-y-3 text-sm text-white/70">
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/search?category=${encodeURIComponent(cat)}`}
                      className="hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="md:col-span-3 bg-white/5 border border-white/10 p-6"
              style={{ borderRadius: "var(--tn-radius)" }}
            >
              <SectionLabel theme={theme} className="mb-3 [&_*]:!text-white/60 !text-white/60">
                Newsletter
              </SectionLabel>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                The day&apos;s technology headlines, in your inbox each morning.
              </p>
              {onOpenNewsletter && (
                <button
                  type="button"
                  onClick={onOpenNewsletter}
                  className="w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] bg-[var(--tn-accent)] text-[var(--tn-accent-ink)] hover:opacity-90 transition-opacity"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50 font-mono">
            <p>© {new Date().getFullYear()} {theme.name}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/search" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/search" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/search" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
