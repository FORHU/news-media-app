"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, Search, User, X } from "lucide-react";
import { FacetLink } from "@/components/FacetLink";
import { PaperDefs, Wordmark } from "./paper";
import { PB_SECTIONS, sectionHref } from "./edit";

export default function PressBigHeader({
  onOpenNewsletter,
}: {
  domain: string;
  onOpenNewsletter?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = (searchParams.get("category") ?? "").toLowerCase();

  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  // Keyboard and screen-reader users: focus moves into the drawer when it opens and back to
  // the menu button when it closes, so they are never left on a page hidden behind it.
  useEffect(() => {
    if (menuOpen) {
      drawerWasOpen.current = true;
      closeBtn.current?.focus();
    } else if (drawerWasOpen.current) {
      drawerWasOpen.current = false;
      menuBtn.current?.focus();
    }
  }, [menuOpen]);

  // The drawer covers the page, so stop the page behind it from scrolling.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const isHome = pathname === "/" && !activeCategory;

  return (
    <div className="pb pb-contents">
      <PaperDefs />
      <header className="pb-header pb-paper">
        <div className="pb-header__bar">
          <Link href="/" aria-label="PressBig, home" onClick={() => setMenuOpen(false)}>
            <Wordmark />
          </Link>

          <nav className="pb-nav" aria-label="Sections">
            {PB_SECTIONS.map((s) => (
              <FacetLink
                key={s.name}
                href={sectionHref(s.name)}
                aria-label={s.name}
                aria-current={activeCategory === s.name.toLowerCase() ? "page" : undefined}
                style={{ ["--ink" as string]: `var(--pb-${s.tone})` }}
              >
                {s.short}
              </FacetLink>
            ))}
          </nav>

          <div className="pb-header__tools">
            <button
              type="button"
              className="pb-iconbtn"
              aria-label={searchOpen ? "Close search" : "Search stories"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((o) => !o)}
            >
              {searchOpen ? <X size={22} strokeWidth={2.25} /> : <Search size={22} strokeWidth={2.25} />}
            </button>
            <FacetLink href="/admin/dashboard" className="pb-iconbtn" aria-label="Staff login">
              <User size={22} strokeWidth={2.25} />
            </FacetLink>
            {onOpenNewsletter && (
              <button
                type="button"
                className="pb-strip pb-paper pb-strip--red"
                style={{ minHeight: "2.5rem", padding: "0.6rem 1rem", fontSize: "0.75rem" }}
                onClick={onOpenNewsletter}
              >
                Get the edit
              </button>
            )}
            <button
              ref={menuBtn}
              type="button"
              className="pb-iconbtn pb-menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="pb-drawer"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-searchbar pb-paper">
            <form onSubmit={submitSearch} role="search">
              <label htmlFor="pb-search" className="sr-only">
                Search PressBig
              </label>
              <input
                id="pb-search"
                ref={searchInput}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, music, games, viral, style, tech"
                autoComplete="off"
              />
            </form>
          </div>
        )}
      </header>

      <div id="pb-drawer" className="pb-drawer" data-open={menuOpen} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!menuOpen}>
        <div className="pb-drawer__top">
          <Wordmark />
          <button ref={closeBtn} type="button" className="pb-iconbtn" style={{ color: "var(--pb-chalk)" }} aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X size={28} strokeWidth={2.25} />
          </button>
        </div>
        <nav aria-label="Sections">
          <Link href="/" onClick={() => setMenuOpen(false)} aria-current={isHome ? "page" : undefined} style={{ color: "var(--pb-red)" }}>
            Today
          </Link>
          {PB_SECTIONS.map((s) => (
            <FacetLink key={s.name} href={sectionHref(s.name)} onClick={() => setMenuOpen(false)}>
              {s.name}
            </FacetLink>
          ))}
        </nav>
        <form onSubmit={submitSearch} role="search" style={{ marginTop: "2rem" }}>
          <label htmlFor="pb-search-m" className="sr-only">
            Search PressBig
          </label>
          <input
            id="pb-search-m"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories"
            style={{ width: "100%", background: "transparent", border: 0, borderBottom: "3px solid var(--pb-chalk)", color: "var(--pb-chalk)", font: "400 1.25rem/1.2 var(--pb-mono)", padding: "0.9rem 0.25rem" }}
          />
        </form>
        {onOpenNewsletter && (
          <button
            type="button"
            className="pb-strip pb-paper pb-strip--red"
            style={{ marginTop: "2rem" }}
            onClick={() => {
              setMenuOpen(false);
              onOpenNewsletter();
            }}
          >
            Get the edit
          </button>
        )}
      </div>
    </div>
  );
}
