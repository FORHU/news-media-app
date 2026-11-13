# Product

<!-- impeccable:product-schema 1 -->

> Scope: this record describes the **PressBig (pressbig.com) tenant only**. `news-media-app` is a multi-tenant codebase (NewsIcons, SkyBluePrime, LavagueTech, the technews family, the Jeju sites, LegalHyper ...); each has its own identity. Nothing here applies to them.

## Platform

web

## Users

Broad mainstream readers (confirmed). English language. They open PressBig for a quick, pleasant read on what is worth their attention across entertainment, fashion, new gadgets and celebrity/culture; no specialist knowledge or niche loyalty assumed. Desktop and mobile both matter.

## Product Purpose

PressBig is a lifestyle and pop-culture site, deliberately **not a hard-news site**: entertainment, fashion and style, new gadgets, and celebrity and culture. Success is a reader who comes back for the day's edit and clicks through to stories.

## Positioning

A **curated daily edit**: fewer, picked stories each day with a clear point of view, rather than an endless firehose of every headline. (Confirmed by the owner.)

## Operating Context

- Content comes from two sources: PressBig's own articles (database, via the admin) and external wire stories fetched live from MediaStack (they link out to the publisher in a new tab; own articles open on /article/<id>).
- The site is one tenant in the shared Next.js app: routing by domain in `src/app/(sites)/[domain]/page.tsx`, per-tenant categories in `src/config/categories.ts`, per-tenant landing/header/footer/article components under `src/components/sites/`.
- MediaStack quota is shared across the whole app (10,000 calls/month plan); each distinct feed costs about 180 calls/month at the current 4-hour cache. See `src/lib/mediastack-feeds.ts`.

## Capabilities and Constraints

- Four sections (confirmed): **Entertainment, Fashion & Style, Gadgets, Celebrity & Culture**. These become the tenant's category list and the topics of its MediaStack feed pools.
- Tenant `pressbig` / `pressbig.com` / site name "PressBig" is seeded in the database; admin login admin@pressbig.com.
- Wire stories carry a source name, headline, short description, image and date only; there is no price, rating or affiliate data.
- Undecided: ad placements and ad network configuration for this tenant; logo and favicon assets; whether PressBig will carry any original article content at launch.

## Brand Commitments

- The name is "PressBig" (one word, as seeded).
- Not hard news: no politics, crime or breaking-news framing.

## Evidence on Hand

- No PressBig articles exist yet (tenant just seeded). Launch content is the MediaStack wire feed only; do not invent articles, bylines, readers or traffic figures.
- No logo or brand assets exist yet.

## Product Principles

1. Curation over volume: every story on a page should look chosen, not dumped.
2. Fun is the job: the tone is entertainment, fashion and gadget enthusiasm, never alarm or urgency.
3. Honest about sources: external stories are clearly attributed and link out; the site never passes wire content off as its own reporting.
4. Works for anyone: no insider knowledge assumed; legible and quick on a phone first.
