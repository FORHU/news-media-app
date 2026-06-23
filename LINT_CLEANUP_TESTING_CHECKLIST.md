# Lint Cleanup — Manual Testing Checklist

Context: the full ESLint cleanup (`npm run lint` 0 problems, now a blocking CI step)
touched ~230 files. Mechanical fixes need no manual testing — `tsc --noEmit` +
`npm run build` + `npm run lint` passing already proves they're safe. The
categories below are where real regressions are possible, and where three
actual bugs were found and fixed during this cleanup (two hydration mismatches,
one broken-image bug from `next/image` + an auth-gated route). Check these.

## Low-risk — skip, already covered by tooling

`no-unused-vars`, `no-explicit-any`, `prefer-const`, `no-empty-object-type`,
`no-require-imports`, stale `eslint-disable` directives — mechanical,
zero-behavior-change fixes across ~300 files. `tsc --noEmit` + `npm run build`
+ `npm run lint` passing **is** the test for this category.

## Medium-risk — quick visual check

- [ ] **`no-unescaped-entities`** (7 tenant article pages): open one article per
  tenant, confirm apostrophes/quotes render normally (`'` not `&#39;`).
- [ ] **`no-html-link-for-pages`**: SkyBluePrime footer — click the logo/home
  link, confirm it navigates without a full page reload.

## High-risk — found real bugs today, test these carefully

### Hydration / theme correctness
Per tenant domain (newsicons, lavaguetech, voicejeju, jejujapan, jejuqq,
jejutime, skyblueprime):

- [ ] Load `/` — open DevTools console **before** the page finishes loading.
  No red "Hydration failed" error. Correct theme/colors render immediately
  (not a flash of the default NewsIcons orange theme).
- [ ] Load `/admin/login` — same hydration + correct-theme check.
- [ ] Load `/admin/dashboard` at desktop width and at a resized/mobile width.
  No hydration error; sidebar starts in the correct open/closed state for
  that width.

### Images via `/api/admin/proxy-image`
- [ ] `/admin/dashboard/external` — All tab and Rejected tab: real images
  load; dead-source articles show the orange placeholder icon, not a
  broken-image icon.
- [ ] `/admin/moderator` — same check, including the edit-article image and
  the preview-panel image.

### `react-hooks/exhaustive-deps` fixes
- [ ] `CrawlJobsTable` (Web Scraping → Manage Targets): jobs list updates
  correctly as data refreshes.
- [ ] `TranscribeHistory` (YouTube Conversion): visiting with `?view=history`
  in the URL scrolls to the history panel.
- [ ] `ManageHandles` (X Monitoring): grouped-by-author view updates
  correctly.

### `react-hooks/set-state-in-effect` fixes
This is where today's regressions came from — be extra careful.

- [ ] `admin/login`, `admin/dashboard/layout.tsx` sidebar — covered above.
- [ ] Tenant `*Header.tsx` (5 files: jejujapan / jejuqq / jejutime /
  lavaguetech / skyblueprime): scroll behavior + mobile menu toggle on each
  tenant's public site.
- [ ] `admin/moderator/page.tsx`, `admin/dashboard/external/page.tsx`:
  tab-switching resets pagination correctly; switching preview articles
  resets the broken-image flag correctly.

### `no-img-element` → `next/image`
10 admin files + SkyBluePrime homepage.

- [ ] Every admin thumbnail list not already checked above.
- [ ] SkyBluePrime public homepage: real external article images render
  (not just the no-image fallback state).

### `react-hooks/immutability` (VoiceJeju)
- [ ] On `voicejeju.com`, confirm the "Report Desk" article feed still
  alternates one primary cluster + secondary clusters correctly. **Must
  test on a production build** (`npm run build && npm start`), not dev,
  since the React Compiler is disabled in dev.
