import { Fragment } from "react";
import Link from "next/link";
import { FacetLink } from "@/components/FacetLink";
import { PressBigAdStrip } from "./PressBigAds";
import type { MediaStackArticle } from "@/lib/mediastack";
import { toFeedRows, type FeedRow } from "../technews-shared/feed";
import { Scrap } from "./paper";
import { buildEdit, sectionHref, toneForRow, type EditSection } from "./edit";
import "./pressbig.css";

interface Props {
  domain: string;
  articles: Parameters<typeof toFeedRows>[0];
  banners?: unknown;
  tenantId?: string | null;
  mediastackArticles?: MediaStackArticle[];
}

/** The lead pick's action: an internal link for our own article, a new tab for a wire story. */
function LeadAction({ row }: { row: FeedRow }) {
  const cls = "pb-strip pb-paper";
  if (row.external) {
    return (
      <a href={row.href} target="_blank" rel="noopener noreferrer nofollow" className={cls}>
        Read the lead pick
      </a>
    );
  }
  return (
    <Link href={row.href} className={cls}>
      Read the lead pick
    </Link>
  );
}

function Band({ section, index }: { section: EditSection; index: number }) {
  const count = section.picks.length;
  if (count === 0) return null;
  // A band of one or two picks always uses the plain layout: the special ones (mirrored lead,
  // wide strip, stagger) need three or more cards to fill their rows.
  const variant = count <= 2 ? 1 : (index % 4) + 1;
  return (
    <section id={section.id} className={`pb-band pb-band--tone-${section.tone} pb-band--v${variant}`} aria-labelledby={`${section.id}-h`}>
      <div className={`pb-band__sheet pb-paper pb-paper--${section.tone}`}>
        <div className="pb-band__inner">
          <header className="pb-band__head">
            <h2 id={`${section.id}-h`} className="pb-display pb-band__name">
              {section.name}
            </h2>
            <div className="pb-band__tools">
              <p className="pb-band__note">Newest first</p>
              <FacetLink href={sectionHref(section.name)} className="pb-strip pb-paper pb-strip--ghost">
                See all {section.name} &rarr;
              </FacetLink>
            </div>
          </header>
          <ul className={`pb-band__wall${count <= 3 ? " pb-band__wall--short" : ""}${count <= 2 ? " pb-band__wall--pair" : ""}`}>
            {section.picks.map((row, i) => (
              <li key={row.id}>
                <Scrap row={row} lead={i === 0} showDescription={i === 0} label={row.external ? row.source ?? undefined : undefined} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * pressbig.com home: a poster hoarding torn back by hand. The first viewport is
 * a chalk sheet torn down the middle; behind the tear the six sections are
 * pasted-up strips, and the three newest stories are scraps stuck across the
 * tear. Below, each section is its own layer with a few picks. Every story is
 * placed once (see buildEdit).
 */
export default function PressBigLanding({ domain, articles, mediastackArticles = [] }: Props) {
  const rows = toFeedRows(articles, mediastackArticles, { domain });
  const { hero, sections, leftover } = buildEdit(rows);
  const lead = hero[0] ?? null;

  return (
    <div className="pb">
      <section className="pb-hero" aria-label="Today's edit">
        <div className="pb-hero__sheet pb-paper">
          <h1 className="pb-display pb-headline">
            <span>Peel</span>
            <span>back</span>
            <span>today.</span>
          </h1>
          <p className="pb-lede">
            Movies, music, games and pop culture first, then style and tech. A few picks from each, pasted up fresh.
          </p>
          <div className="pb-actions">
            {lead && <LeadAction row={lead} />}
            <a href="#sections" className="pb-strip pb-paper pb-strip--ghost">
              See the sections
            </a>
          </div>
        </div>

        <div className="pb-hero__wall" id="sections">
          <ul className="pb-layers">
            {sections.map((s, i) => (
              <li key={s.id} className={`pb-layer pb-layer--${s.rank}`} style={{ ["--i" as string]: i }}>
                <FacetLink href={sectionHref(s.name)} className={`pb-layer__link pb-paper pb-paper--${s.tone}`}>
                  <span className="pb-display pb-layer__name">{s.name}</span>
                  <span className="pb-layer__count">
                    {s.available ? "See them all" : "Nothing pasted up yet"}
                  </span>
                </FacetLink>
              </li>
            ))}
          </ul>
        </div>

        {hero.length > 0 && (
          <ul className="pb-hero__scraps" aria-label="The newest picks">
            {hero.map((row, i) => (
              <li key={row.id} style={{ display: "contents", ["--i" as string]: i }}>
                <Scrap row={row} lead={i === 0} leadTag={i === 0} className="pb-lift" tone={toneForRow(row)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {rows.length === 0 && (
        <div className="pb-page">
          <div className="pb-page__inner">
            <div className="pb-empty pb-paper">
              <h2 className="pb-display">The wall is bare.</h2>
              <p>Nothing has been pasted up yet. Check back soon.</p>
            </div>
          </div>
        </div>
      )}

      {sections.map((s, i) => (
        <Fragment key={s.id}>
          <Band section={s} index={i} />
          {/* Two ads on the whole page, after the 2nd and 4th section, never inside a band. */}
          {(i === 1 || i === 3) && s.picks.length > 0 && <PressBigAdStrip tilt={i === 1 ? "left" : "right"} />}
        </Fragment>
      ))}

      {leftover.length > 0 && (
        <section className="pb-more" aria-labelledby="pb-more-h">
          <div className="pb-more__inner">
            <h2 id="pb-more-h" className="pb-display pb-more__title">
              Still stuck to the wall
            </h2>
            <ul className="pb-more__grid">
              {leftover.map((row) => (
                <li key={row.id}>
                  <Scrap row={row} tone={toneForRow(row)} />
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "2.5rem" }}>
              <FacetLink href="/search" className="pb-strip pb-paper pb-strip--black">
                Browse every story &rarr;
              </FacetLink>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
