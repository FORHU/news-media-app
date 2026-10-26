/**
 * MediaStack only gives newsicons.com a single "technology" feed, so it can't
 * be placed under the site's category blocks by its own tag. Like techoggi,
 * each wire item is bucketed into the NewsIcons taxonomy by keyword-matching
 * its title/description (the keyword table is shared with the tech-news sites).
 * Best-effort: unmatched items stay out of the category blocks (they still
 * appear in Latest News and the wire sections).
 */
export { classifyEnglishTechCategory as classifyNewsIconsCategory } from "../technews-shared/categorize";
