"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, User, X } from "lucide-react";
import ContactEmailButton from "@/components/ContactEmailButton";
import { getCoreCategories, HOME_CATEGORY_LABEL } from "@/config/categories";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { Wordmark } from "../technews-shared/parts";

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function LinkTechNewsHeader({
  domain,
  onOpenNewsletter,
}: {
  domain: string;
  onOpenNewsletter?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);

  const theme = getTechNewsTheme(domain);
  const categories = getCoreCategories(domain);
  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;
  const isCatActive = (cat: string) => activeCategory.toLowerCase() === cat.toLowerCase();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!theme) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      setIsMenuOpen(false);
      hideSuggestions();
    }
  };

  return (
    <header
      style={techNewsVars(theme)}
      className="sticky top-0 z-50 bg-[var(--tn-surface)] border-b border-[var(--tn-ink)]"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 xl:gap-6 h-full">
            <button
              type="button"
              onClick={() => setIsMenuOpen((o) => !o)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--tn-ink)] hover:text-[var(--tn-accent)] transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              aria-controls="technews-drawer"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/" className="flex items-center shrink-0 h-full" aria-label={theme.name}>
              <Wordmark theme={theme} className="text-xl sm:text-2xl" />
            </Link>
          </div>

          <div className="flex items-center gap-2 xl:gap-5 h-full">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--tn-ink)] hover:text-[var(--tn-accent)] transition-colors"
              aria-label="Toggle search"
              aria-expanded={isSearchOpen}
            >
              <Search size={20} />
            </button>

            <ContactEmailButton
              wrapperClassName="hidden sm:block"
              buttonClassName="p-1 text-[var(--tn-ink)] hover:text-[var(--tn-accent)] transition-colors"
              iconSize={20}
            />
            <Link
              href="/admin/dashboard"
              className="p-1 text-[var(--tn-ink)] hover:text-[var(--tn-accent)] transition-colors hidden sm:block"
              aria-label="Admin Portal"
            >
              <User size={20} />
            </Link>

            {onOpenNewsletter && (
              <button
                type="button"
                onClick={onOpenNewsletter}
                className="hidden md:inline-flex items-center bg-[var(--tn-accent)] text-[var(--tn-accent-ink)] text-[11px] font-bold uppercase tracking-[0.16em] px-3.5 py-2 hover:opacity-90 transition-opacity"
                style={{ borderRadius: "var(--tn-radius)" }}
              >
                Subscribe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category rail */}
      <div className="border-t border-[var(--tn-rule)] hidden lg:block overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="max-w-[1600px] mx-auto px-6 py-2.5 flex items-center justify-start xl:justify-center gap-6 xl:gap-8 font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
          <Link
            href="/"
            className={`whitespace-nowrap shrink-0 transition-colors ${
              isHome
                ? "text-[var(--tn-accent)]"
                : "text-[var(--tn-ink)] hover:text-[var(--tn-accent)]"
            }`}
          >
            {HOME_CATEGORY_LABEL}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={categoryHref(cat)}
              aria-current={isCatActive(cat) ? "page" : undefined}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                isCatActive(cat)
                  ? "text-[var(--tn-accent)]"
                  : "text-[var(--tn-ink)] hover:text-[var(--tn-accent)]"
              }`}
            >
              {cat}
            </Link>
          ))}
        </nav>
      </div>

      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full bg-[var(--tn-surface)] border-b border-[var(--tn-rule)] shadow-md py-4 px-4 z-40">
          <div className="max-w-[1600px] mx-auto">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--tn-muted)]"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={hideSuggestions}
                placeholder="Search stories, topics, or authors…"
                className="w-full pl-12 pr-4 py-3 border-b-2 border-[var(--tn-rule)] bg-transparent text-lg text-[var(--tn-ink)] placeholder:text-[var(--tn-muted)] focus:outline-none focus:border-[var(--tn-accent)] transition-colors"
                autoFocus
              />
              {showSuggestions && (
                <SearchDropdown
                  query={query}
                  suggestions={suggestions}
                  isSearching={isSearching}
                  theme="light"
                  onSelect={() => {
                    hideSuggestions();
                    setIsSearchOpen(false);
                  }}
                />
              )}
            </form>
          </div>
        </div>
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-0 bg-[var(--tn-ink)]/40 z-[60] transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        id="technews-drawer"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        style={techNewsVars(theme)}
        className={`fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-[var(--tn-ink)] text-[var(--tn-bg)] z-[70] shadow-2xl transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/15">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-[var(--tn-bg)]">
            <Wordmark theme={theme} className="text-lg [&_*]:!text-[var(--tn-bg)]" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-8 space-y-5">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className={`block font-mono text-sm font-bold uppercase tracking-[0.14em] transition-colors ${
              isHome ? "text-[var(--tn-accent)]" : "hover:text-[var(--tn-accent)]"
            }`}
          >
            {HOME_CATEGORY_LABEL}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={categoryHref(cat)}
              onClick={() => setIsMenuOpen(false)}
              aria-current={isCatActive(cat) ? "page" : undefined}
              className={`block font-mono text-sm font-bold uppercase tracking-[0.14em] transition-colors ${
                isCatActive(cat) ? "text-[var(--tn-accent)]" : "hover:text-[var(--tn-accent)]"
              }`}
            >
              {cat}
            </Link>
          ))}
          <div className="pt-6 mt-6 border-t border-white/15 flex flex-col gap-5">
            {onOpenNewsletter && (
              <button
                type="button"
                onClick={() => {
                  onOpenNewsletter();
                  setIsMenuOpen(false);
                }}
                className="text-left font-mono text-sm font-bold uppercase tracking-[0.14em] text-[var(--tn-accent)] hover:text-white transition-colors"
              >
                Subscribe
              </button>
            )}
            <ContactEmailButton
              wrapperClassName="sm:hidden"
              buttonClassName="block font-mono text-sm font-bold uppercase tracking-[0.14em] text-[var(--tn-accent)] hover:text-white transition-colors"
              showIcon={false}
              showLabel
              labelText="Contact Us"
              inline
            />
            <Link
              href="/admin/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="block font-mono text-sm font-bold uppercase tracking-[0.14em] text-[var(--tn-accent)] hover:text-white transition-colors sm:hidden"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
