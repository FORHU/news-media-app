"use client";

import Link from "next/link";
import { FacetLink } from "@/components/FacetLink";
import { getCoreCategories } from "@/config/categories";
import { Wordmark } from "./paper";
import { sectionHref } from "./edit";

export default function PressBigFooter({
  domain,
  onOpenNewsletter,
}: {
  domain: string;
  onOpenNewsletter?: () => void;
}) {
  const categories = getCoreCategories(domain);

  return (
    <footer className="pb pb-footer">
      <div className="pb-footer__sheet pb-paper">
        <div className="pb-footer__grid">
          <div>
            <Link href="/" aria-label="PressBig, home">
              <Wordmark />
            </Link>
            <p style={{ marginTop: "1rem", maxWidth: "30ch" }}>
              The day&apos;s edit of entertainment, fashion, gadgets and culture. Picked, not piled.
            </p>
          </div>

          <div>
            <h2>Sections</h2>
            <ul>
              {categories.map((cat) => (
                <li key={cat}>
                  <FacetLink href={sectionHref(cat)}>{cat}</FacetLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Around the site</h2>
            <ul>
              <li>
                <Link href="/">Today&apos;s edit</Link>
              </li>
              <li>
                <FacetLink href="/search">Every story</FacetLink>
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
            <h2>The edit by email</h2>
            <p style={{ marginBottom: "1rem", maxWidth: "30ch" }}>Get the picks in your inbox.</p>
            {onOpenNewsletter && (
              <button type="button" className="pb-strip pb-paper" onClick={onOpenNewsletter}>
                Subscribe
              </button>
            )}
          </div>
        </div>

        <div className="pb-footer__fine">
          <p>© {new Date().getFullYear()} PressBig</p>
          <p>Stories from other publishers open in a new tab and stay credited to their source.</p>
        </div>
      </div>
    </footer>
  );
}
