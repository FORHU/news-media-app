import { FacetLink } from "@/components/FacetLink";
import type { MediaStackArticle } from "@/lib/mediastack";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FlagIcon } from "./mark";
import { StoryCard, StoryLink, cleanRows, formatDay, metaLabel, timeAgo } from "./parts";
import { StoryImage } from "./StoryImage";
import { buildGolfEdit, sectionHref, type GolfSection } from "./edit";
import "./golfcarrier.css";

interface Props {
  domain: string;
  articles: Parameters<typeof toFeedRows>[0];
  banners?: unknown;
  tenantId?: string | null;
  mediastackArticles?: MediaStackArticle[];
}

function Lead({ row }: { row: FeedRow }) {
  const source = metaLabel(row);
  return (
    <StoryLink row={row} className="gc-lead">
      <div className="gc-lead__img">
        <StoryImage src={row.imageUrl} eager />
        <span className="gc-lead__chip">
          <FlagIcon size={12} /> Lead story
        </span>
      </div>
      <div className="gc-lead__text">
        {row.category?.categoryName && <span className="gc-kicker">{row.category.categoryName}</span>}
        <h2 className="gc-lead__title">{row.title}</h2>
        {row.content && <p className="gc-lead__desc">{excerpt(row.content, 220)}</p>}
        <p className="gc-meta">
          {source && source !== row.category?.categoryName && <b>{source}</b>}
          <time dateTime={row.createdAt}>{formatDay(row.createdAt)}</time>
          {row.external && <span className="gc-meta__out" aria-label="opens the publisher's site">↗</span>}
        </p>
      </div>
    </StoryLink>
  );
}

/** The newest stories as a tournament scoreboard: position, story, how long ago. */
function Leaderboard({ rows, now }: { rows: FeedRow[]; now: number }) {
  if (rows.length === 0) return null;
  return (
    <section className="gc-board gc-on-dark" aria-labelledby="gc-board-h">
      <div className="gc-board__head">
        <h2 id="gc-board-h" className="gc-board__title">
          The Leaderboard
        </h2>
        <span className="gc-board__pill">Latest</span>
      </div>
      <div className="gc-board__cols" aria-hidden="true">
        <span>Pos</span>
        <span>Story</span>
        <span>When</span>
      </div>
      <ol className="gc-board__list">
        {rows.map((row, i) => (
          <li key={row.id}>
            <StoryLink row={row} className="gc-board__row">
              <span className="gc-board__pos" aria-hidden="true">
                {i + 1}
              </span>
              <span className="gc-board__story">
                <span className="gc-board__headline">{row.title}</span>
                {metaLabel(row) && <span className="gc-board__src">{metaLabel(row)}</span>}
              </span>
              <time className="gc-board__when" dateTime={row.createdAt}>
                {timeAgo(row.createdAt, now)}
              </time>
            </StoryLink>
          </li>
        ))}
      </ol>
      <div className="gc-board__foot">
        <FacetLink href="/search" className="gc-board__more">
          Full field &rarr;
        </FacetLink>
      </div>
    </section>
  );
}

/** The seven sections as a scorecard: hole number, section, story count. */
function Scorecard({ sections }: { sections: GolfSection[] }) {
  return (
    <section className="gc-scorecard" aria-labelledby="gc-scorecard-h">
      <div className="gc-wrap">
        <div className="gc-scorecard__label">
          <h2 id="gc-scorecard-h">The Card</h2>
          <p>{sections.length} sections</p>
        </div>
        <ol className="gc-scorecard__grid">
          {sections.map((s) => (
            <li key={s.id}>
              <FacetLink href={sectionHref(s.name)} className="gc-hole">
                <span className="gc-hole__no">
                  Hole <b>{s.hole}</b>
                </span>
                <span className="gc-hole__name">{s.name}</span>
                <span className={`gc-hole__count ${s.total === 0 ? "gc-hole__count--zero" : ""}`}>
                  {s.total === 0 ? "Coming soon" : `${s.total} ${s.total === 1 ? "story" : "stories"}`}
                </span>
              </FacetLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SectionBlock({ section, alt }: { section: GolfSection; alt: boolean }) {
  if (section.picks.length === 0) return null;
  return (
    <section id={section.id} className={`gc-section ${alt ? "gc-section--alt" : ""}`} aria-labelledby={`${section.id}-h`}>
      <div className="gc-wrap">
        <header className="gc-section__head">
          <div>
            <span className="gc-kicker">
              <FlagIcon size={12} /> Hole {section.hole}
            </span>
            <h2 id={`${section.id}-h`} className="gc-section__title">
              {section.name}
            </h2>
          </div>
          <FacetLink href={sectionHref(section.name)} className="gc-section__link">
            All {section.name} &rarr;
          </FacetLink>
        </header>
        <ul className="gc-section__grid">
          {section.picks.map((row, i) => (
            <li key={row.id}>
              <StoryCard
                row={row}
                feature={i === 0}
                showDescription={i === 0}
                kicker={row.external ? row.source ?? section.name : section.name}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * golfcarrier.com home: a lead story beside the Leaderboard (the newest
 * stories), the Scorecard (sections as holes, with counts), one block per
 * section, then the rest as a compact list. Every story appears once.
 */
export default function GolfCarrierLanding({ domain, articles, mediastackArticles = [] }: Props) {
  const rows = cleanRows(toFeedRows(articles, mediastackArticles, { domain }));
  const { lead, board, sections, leftover } = buildGolfEdit(rows);
  // Server-rendered (the page revalidates every few minutes), so "4h ago" stays close enough.
  // eslint-disable-next-line react-hooks/purity -- server component; the clock read is intentional
  const now = Date.now();

  return (
    <div className="gc">
      <div className="gc-today">
        <div className="gc-wrap">
          <h1>Today in golf</h1>
          <p>{rows.length > 0 ? `${rows.length} stories from every tour` : "Every tour. Every shot."}</p>
        </div>
      </div>

      {lead ? (
        <section className="gc-hero" aria-label="Top stories">
          <div className="gc-wrap">
            <div className="gc-hero__grid">
              <Lead row={lead} />
              <Leaderboard rows={board} now={now} />
            </div>
          </div>
        </section>
      ) : (
        <div className="gc-wrap">
          <div className="gc-empty">
            <h2>The course is quiet.</h2>
            <p>No stories yet. Check back soon for the latest from every tour.</p>
          </div>
        </div>
      )}

      <Scorecard sections={sections} />

      {sections.map((s, i) => (
        <SectionBlock key={s.id} section={s} alt={i % 2 === 0} />
      ))}

      {leftover.length > 0 && (
        <section className="gc-more" aria-labelledby="gc-more-h">
          <div className="gc-wrap">
            <h2 id="gc-more-h" className="gc-more__title">
              More from the course
            </h2>
            <ul className="gc-list">
              {leftover.map((row) => (
                <li key={row.id}>
                  <StoryLink row={row} className="gc-list__item">
                    {row.category?.categoryName && <span className="gc-kicker">{row.category.categoryName}</span>}
                    <h3>{row.title}</h3>
                    <p className="gc-meta">
                      {metaLabel(row) && metaLabel(row) !== row.category?.categoryName && <b>{metaLabel(row)}</b>}
                      <time dateTime={row.createdAt}>{formatDay(row.createdAt)}</time>
                    </p>
                  </StoryLink>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "2rem" }}>
              <FacetLink href="/search" className="gc-btn gc-btn--ghost">
                Browse every story &rarr;
              </FacetLink>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
