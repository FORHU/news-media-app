/**
 * Retired article URLs, per tenant.
 *
 * A slug listed here no longer exists on that site. proxy.ts answers it
 * before the app renders, so it is never a soft 404 and never carries the
 * homepage canonical:
 *
 *   - string value  -> HTTP 301 to /article/<that slug> on the SAME host
 *   - null          -> HTTP 410 Gone (noindex)
 *
 * Rules for adding an entry:
 *   - Only point at a slug you have confirmed returns 200 on that same host.
 *     Never invent a destination or point at another host.
 *   - Never list a live article's slug.
 *   - A trailing "*" matches any slug starting with the text before it (use it
 *     only when the exact slug was truncated and no live slug shares the prefix).
 *
 * Slugs are stored decoded (unicode as-is). Lookups decode the request path.
 * Verified against the live sites on 2026-11-11 (see PR for curl evidence).
 */
export type RetiredArticleMap = Record<string, Record<string, string | null>>;

export const RETIRED_ARTICLES: RetiredArticleMap = {
  "legalhyper.com": {
    "2026-09-10-transforming-legal-operations-ilovelawyer-2": null,
    "2026-09-10-forhu-inc-pioneers-ai-governance": null,
    "2026-09-10-forhu-revolutionizes-ai-transparency-new": null,
  },
  "techhoy.com": {
    // English slug on the Spanish site; no Spanish counterpart exists.
    "2026-09-16-ilovelawyer-revolutionizing-legal-practice-ai-powered-2": null,
  },
  "lavaguetech.com": {
    "2026-09-09-forhu-engineering-glassbox-era-trustworthy-5": null,
  },
  "newyorksignal.com": {
    "2026-09-10-transforming-legal-operations-introducing-ilovelawyer": null,
  },
  "skyblueprime.com": {
    "2026-09-16-ilovelawyer-revolutionizing-legal-practice-ai-powered-11": null,
    "2026-09-10-forhu-inc-shapes-future-ai-2": null,
    "2026-09-10-revolutionizing-legal-practice-ilovelawyer-2": null,
    "2026-09-10-forhu-revolutionary-approach-ai-transparency": null,
    "2026-09-08-forhu-engineering-glassbox-era-trustworthy-2": null,
    "2026-06-03-can-ai-explain-why-recommends": null,
    // Raw database ids from an earlier URL scheme. They no longer resolve
    // (the article lookup also accepts ids), so the rows are gone.
    cmp9ct0pw0008c0v9zsmccg96: null,
    cmp9ct1jy000dc0v94ijmrzn1: null,
    cmp9ct17y000bc0v9xi2iy0xg: null,
  },
  "linktechnews.com": {
    "2026-09-10-forhu-inc-shifts-ai-governance": null,
    // Numbered duplicate; the un-numbered original is live (200).
    "2026-09-09-forhu-engineering-glassbox-era-trustworthy-8":
      "2026-09-09-forhu-engineering-glassbox-era-trustworthy",
  },
  "magazinetechy.com": {
    "2026-09-10-forhu-aims-unlock-ai-transparency": null,
    "2026-09-09-forhu-engineering-glassbox-era-trustworthy-10": null,
  },
  "magazineair.com": {
    // Same-day, same-topic ("five AI legal software platforms for law firms")
    // sibling that is live on this host.
    "2026-09-24-five-leading-ai-legal-software-platforms-law-firms-2026":
      "2026-09-24-how-should-small-law-firm-choose-ai-software-five-platforms",
    "2026-09-10-forhu-inc-pioneers-ai-governance-2": null,
    "2026-09-10-forhu-aims-enhance-ai-transparency": null,
    "2026-09-10-revolutionizing-legal-operations-ilovelawyer-2": null,
    "2026-09-09-forhu-engineering-glassbox-era-trustworthy-11": null,
  },
  "techygate.com": {
    "2026-09-10-forhu-inc-unveils-innovative-ai": null,
    "2026-09-09-forhu-engineering-glassbox-era-trustworthy-12": null,
  },
  "newsicons.com": {
    cmnog05vh000004jxc1xx6nm5: null,
    cmnoebobw0000c0v9wqpfnuld: null,
    cmnoelto40003c0v9sgiig952: null,
    cmnoetc1d0004c0v9sru61b8i: null,
    cmnoecys00001c0v92qv6i22e: null,
    cmncrmbwp0000ekv66oztxtgn: null,
    "2026-04-16-house-democrats-launch-impeachment-against": null,
    "2026-09-08-forhu-engineering-glassbox-era-trustworthy": null,
  },
  "voicejeju.com": {
    // Appendix slug was truncated; no live slug starts with this prefix.
    "2026-05-28-제주도의-봄-유채꽃과-벚꽃이-물든*": null,
  },
};
