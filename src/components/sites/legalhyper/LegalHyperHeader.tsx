"use client"; // LegalHyper Header — centered broadsheet masthead ("The Legal Review" design)

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import ContactEmailButton from "@/components/ContactEmailButton";
import { getCoreCategories, getHomeCategoryLabel } from "@/config/categories";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";

const BREAKING_HEADLINES = [
  "Legal AI's grounded-reasoning claims face first independent benchmark",
  "Legal Geek London opens registration with record exhibitor list",
  "Regulators in three jurisdictions open coordinated review of legal AI tools",
];

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export function LegalHyperHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;
  const isCatActive = (cat: string) => activeCategory.toLowerCase() === cat.toLowerCase();
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);

  const coreCategories = getCoreCategories("legalhyper.com");
  const homeLabel = getHomeCategoryLabel("legalhyper.com");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      hideSuggestions();
    }
  };

  const tickerItems = [...BREAKING_HEADLINES, ...BREAKING_HEADLINES];
  const [tickerTime, setTickerTime] = useState("");
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      await Promise.resolve();
      if (!cancelled) setTickerTime(t);
    };
    update();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="w-full font-chivo" style={{ background: "#F4F0E6", color: "#1A1A16" }}>
      {/* Utility bar */}
      <div style={{ background: "#0B1424", color: "#C6CBD6" }}>
        <div className="max-w-[1340px] mx-auto px-4 sm:px-7 flex flex-wrap items-center justify-between gap-3.5 min-h-[36px] text-[10px] sm:text-[10.5px] uppercase" style={{ letterSpacing: "0.18em" }}>
          <div className="py-1.5">Est. 1998 &nbsp;·&nbsp; International Edition</div>
          <div className="hidden sm:flex flex-wrap gap-5 py-1.5">
            <span className="opacity-80">Legal Updates</span>
            <span className="opacity-80">Newsletter</span>
            <ContactEmailButton
              buttonClassName="opacity-80 hover:opacity-100 hover:text-[#C2A15A] transition-colors"
              showIcon={false}
              showLabel
              labelText="Contact"
              theme="legalhyper"
              inline
            />
            <Link href="/admin/dashboard" className="opacity-80 hover:opacity-100 hover:text-[#C2A15A] transition-colors">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Centered masthead row */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-7 pt-6 flex items-center justify-between gap-6 flex-wrap">
        <button
          type="button"
          onClick={() => setIsSearchOpen((v) => !v)}
          className="order-1 flex items-center gap-2 px-3.5 py-2 text-[10.5px] uppercase tracking-[0.16em]"
          style={{ background: "none", border: "1px solid #CBC4B1", color: "#3B3B33" }}
        >
          <Search size={13} strokeWidth={1.5} />
          <span className="hidden sm:inline">Search</span>
        </button>

        <Link href="/" className="order-2 flex-1 flex flex-col items-center gap-3 text-center" style={{ flexBasis: 320 }}>
          <div className="flex items-end gap-1" style={{ height: 22 }}>
            <span style={{ width: 3, height: 16, background: "#B08D3F", display: "block" }} />
            <span style={{ width: 3, height: 22, background: "#0E1A2F", display: "block" }} />
            <span style={{ width: 3, height: 16, background: "#B08D3F", display: "block" }} />
          </div>
          <div
            className="font-bodoni uppercase"
            style={{ fontSize: "clamp(28px,5vw,50px)", fontWeight: 500, letterSpacing: "0.06em", lineHeight: 1, color: "#0E1A2F" }}
          >
            LegalHyper
          </div>
          <div className="font-garamond uppercase" style={{ fontSize: 12, letterSpacing: "0.34em", color: "#7A7466" }}>
            Legal AI · LegalTech · Policy
          </div>
        </Link>

        <button
          type="button"
          onClick={onOpenNewsletter}
          className="order-3 hidden sm:inline-block px-5 py-2.5 text-[10.5px] uppercase tracking-[0.18em] font-medium"
          style={{ background: "#0E1A2F", color: "#F4F0E6" }}
        >
          Subscribe
        </button>
      </div>

      {/* Date rule */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-7 pt-5">
        <div
          className="text-center text-[10.5px] uppercase"
          style={{ letterSpacing: "0.26em", color: "#5C5749", borderTop: "1px solid #0E1A2F", borderBottom: "1px solid #B08D3F", padding: "9px 0" }}
        >
          {today}
        </div>
      </div>

      {isSearchOpen && (
        <div style={{ background: "#EAE5D8", borderBottom: "1px solid #DCD5C2" }}>
          <div className="max-w-[1340px] mx-auto px-4 sm:px-7 py-4 flex gap-3 relative">
            <form onSubmit={handleSearch} className="flex-1 flex gap-3">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={hideSuggestions}
                placeholder="Search rulings, courts, statutes, counsel"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px]"
                style={{ border: "none", borderBottom: "1px solid #0E1A2F", padding: "10px 2px", color: "#1A1A16" }}
              />
              <button type="submit" className="px-6 py-2.5 text-[10.5px] uppercase tracking-[0.16em]" style={{ background: "#0E1A2F", color: "#F4F0E6", border: "none" }}>
                Search
              </button>
              <button type="button" onClick={() => { setIsSearchOpen(false); setQuery(""); hideSuggestions(); }} className="p-2" aria-label="Close search">
                <X size={16} />
              </button>
            </form>
            {showSuggestions && (
              <div className="absolute left-4 right-4 sm:left-7 sm:right-7 top-full">
                <SearchDropdown query={query} suggestions={suggestions} isSearching={isSearching} theme="legalhyper" onSelect={() => { hideSuggestions(); setIsSearchOpen(false); }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Centered nav */}
      <nav className="max-w-[1340px] mx-auto px-4 sm:px-7">
        <div className="flex gap-7 justify-center overflow-x-auto whitespace-nowrap" style={{ borderBottom: "1px solid #0E1A2F" }}>
          <Link
            href="/"
            className="py-3.5 text-[11px] uppercase tracking-[0.2em] font-bold"
            style={{ color: "#0E1A2F", borderBottom: isHome ? "2px solid #B08D3F" : "2px solid transparent" }}
          >
            {homeLabel}
          </Link>
          {coreCategories.map((cat) => (
            <Link
              key={cat}
              href={categoryHref(cat)}
              className="py-3.5 text-[11px] uppercase tracking-[0.2em]"
              style={{
                color: isCatActive(cat) ? "#0E1A2F" : "#3B3B33",
                fontWeight: isCatActive(cat) ? 700 : 400,
                borderBottom: isCatActive(cat) ? "2px solid #B08D3F" : "2px solid transparent",
              }}
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      {/* Breaking ticker — light background per this design */}
      <div style={{ background: "#F4F0E6", borderBottom: "1px solid #DCD5C2", overflow: "hidden" }}>
        <div className="max-w-[1340px] mx-auto px-4 sm:px-7 flex items-center gap-4.5 h-[42px]" style={{ gap: 18 }}>
          <div
            className="shrink-0 flex items-center gap-2 text-[10px] font-bold uppercase"
            style={{ background: "#7A1F2B", color: "#F4F0E6", padding: "5px 11px", letterSpacing: "0.22em" }}
          >
            Breaking
          </div>
          <div className="flex-1 overflow-hidden h-[42px]">
            <div className="flex items-center h-[42px] w-max gap-14 animate-lex-ticker">
              {[0, 1].map((group) => (
                <div key={group} className="flex gap-14 shrink-0">
                  {tickerItems.map((headline, i) => (
                    <span key={`${group}-${i}`} className="text-[14px] whitespace-nowrap" style={{ color: "#26261F" }}>
                      {headline}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-[10.5px] uppercase" style={{ letterSpacing: "0.16em", color: "#7A7466" }}>
            {tickerTime && `${tickerTime} EDT`}
          </div>
        </div>
      </div>
    </header>
  );
}
