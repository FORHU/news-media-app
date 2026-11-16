"use client";

import Link from "next/link";
import { FacetLink } from "@/components/FacetLink";
import { GOLF_TAGLINE } from "./brand";
import { GolfWordmark } from "./mark";
import { GC_SECTIONS, sectionHref } from "./edit";
import "./golfcarrier.css";

export default function GolfCarrierFooter({ onOpenNewsletter }: { domain: string; onOpenNewsletter?: () => void }) {
  return (
    <footer className="gc gc-footer gc-on-dark">
      <div className="gc-footer__band" aria-hidden="true" />
      <div className="gc-wrap">
        <div className="gc-footer__grid">
          <div className="gc-footer__about">
            <Link href="/" aria-label="GolfCarrier, home">
              <GolfWordmark onDark size={32} />
            </Link>
            <p>
              Golf news from every tour: tournaments, majors, players, equipment, instruction and the courses worth the
              trip.
            </p>
            <p className="gc-footer__tag">{GOLF_TAGLINE}</p>
          </div>

          <div>
            <h2>Sections</h2>
            <ul>
              {GC_SECTIONS.map((name) => (
                <li key={name}>
                  <FacetLink href={sectionHref(name)}>{name}</FacetLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>GolfCarrier</h2>
            <ul>
              <li>
                <Link href="/">Latest</Link>
              </li>
              <li>
                <FacetLink href="/search">All stories</FacetLink>
              </li>
              <li>
                <a href="mailto:socials@forhu.ai">Contact</a>
              </li>
              <li>
                <FacetLink href="/admin/dashboard">Staff login</FacetLink>
              </li>
            </ul>
          </div>

          <div>
            <h2>Newsletter</h2>
            <p style={{ marginBottom: "1rem", fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(244,241,232,0.8)" }}>
              The week in golf, in your inbox.
            </p>
            {onOpenNewsletter && (
              <button type="button" className="gc-btn gc-btn--flag" onClick={onOpenNewsletter}>
                Subscribe
              </button>
            )}
          </div>
        </div>

        <div className="gc-footer__fine">
          <p>© {new Date().getFullYear()} GolfCarrier</p>
          <p>Stories from other publishers open in a new tab and stay credited to their source.</p>
        </div>
      </div>
    </footer>
  );
}
