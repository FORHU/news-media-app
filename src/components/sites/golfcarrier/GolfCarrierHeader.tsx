"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, User, X } from "lucide-react";
import { FacetLink } from "@/components/FacetLink";
import { normalizeCategoryKey } from "@/config/categories";
import { GOLF_TAGLINE } from "./brand";
import { GolfWordmark } from "./mark";
import { GC_SECTIONS, sectionHref } from "./edit";
import "./golfcarrier.css";

/**
 * golfcarrier.com header: an ink tagline strip, the wordmark bar, and a
 * section row that scrolls sideways on small screens (so there is no drawer:
 * every section stays one tap away).
 */
export default function GolfCarrierHeader({ onOpenNewsletter }: { domain: string; onOpenNewsletter?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeKey = normalizeCategoryKey(searchParams.get("category"));

  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const isHome = pathname === "/" && !activeKey;

  return (
    <div className="gc gc-contents">
      <header className="gc-header">
        <div className="gc-topline gc-on-dark">
          <div className="gc-wrap">
            <p>
              <span className="gc-topline__dot" aria-hidden="true" />
              {GOLF_TAGLINE}
            </p>
            {onOpenNewsletter && (
              <button type="button" onClick={onOpenNewsletter}>
                Newsletter
              </button>
            )}
          </div>
        </div>

        <div className="gc-wrap">
          <div className="gc-header__bar">
            <Link href="/" aria-label="GolfCarrier, home">
              <GolfWordmark />
            </Link>

            <div className="gc-header__tools">
              <button
                type="button"
                className="gc-iconbtn"
                aria-label={searchOpen ? "Close search" : "Search golf news"}
                aria-expanded={searchOpen}
                aria-controls="gc-search"
                onClick={() => setSearchOpen((o) => !o)}
              >
                {searchOpen ? <X size={20} strokeWidth={2.25} /> : <Search size={20} strokeWidth={2.25} />}
              </button>
              <FacetLink href="/admin/dashboard" className="gc-iconbtn" aria-label="Staff login">
                <User size={20} strokeWidth={2.25} />
              </FacetLink>
              {onOpenNewsletter && (
                <button type="button" className="gc-btn gc-btn--sm gc-header__subscribe" onClick={onOpenNewsletter}>
                  Subscribe
                </button>
              )}
            </div>
          </div>
        </div>

        <nav className="gc-nav" aria-label="Sections">
          <div className="gc-wrap">
            <div className="gc-nav__list">
              <Link href="/" className="gc-nav__item" aria-current={isHome ? "page" : undefined}>
                Latest
              </Link>
              {GC_SECTIONS.map((name) => (
                <FacetLink
                  key={name}
                  href={sectionHref(name)}
                  className="gc-nav__item"
                  aria-current={activeKey === normalizeCategoryKey(name) ? "page" : undefined}
                >
                  {name}
                </FacetLink>
              ))}
            </div>
          </div>
        </nav>

        {searchOpen && (
          <div className="gc-searchbar" id="gc-search">
            <div className="gc-wrap">
              <form onSubmit={submitSearch} role="search">
                <label htmlFor="gc-search-input" className="sr-only">
                  Search GolfCarrier
                </label>
                <input
                  id="gc-search-input"
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search players, tournaments, gear"
                  autoComplete="off"
                />
                <button type="submit" className="gc-btn">
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
