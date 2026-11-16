/**
 * Golf relevance and section rules for golfcarrier.com's MediaStack feed.
 * Pure functions (no fetching), so they can be unit-tested; mediastack-feeds.ts
 * applies them to the merged pools.
 */

interface StoryText {
  title: string;
  description?: string | null;
}

/** Golf words. In a headline any one is enough; in a description it takes two. */
export const GOLF_TERMS =
  /\b(?:golf(?:er|ers|ing)?|PGA|LPGA|LIV|DP World Tour|Ryder Cup|Solheim Cup|Presidents Cup|Masters|Open Championship|birdies?|bogeys?|eagles? putt|fairways?|putts?|putter|caddies?|tee shot|tee box|green jacket|par[- ]?\d|hole[- ]in[- ]one|(?:first|second|third|final)[- ]round lead|\d+-shot lead|under[- ]par|tee times?)\b/gi;

/**
 * Tour and player words that make a description about golf on their own:
 * stories about an event ("Storylines for the Wyndham Championship") often
 * name the tour only once, in the description.
 */
const STRONG_GOLF_TERMS =
  /\b(?:PGA Tour|LPGA|LIV Golf|DP World Tour|Korn Ferry Tour|PGA Tour Champions|Sunshine (?:Development )?Tour|Asian Tour|Ladies European Tour|golfers?)\b/i;

/**
 * Names that make a headline a golf story by themselves (players who are rarely
 * in the news for anything else). Kept short on purpose: a name that also
 * belongs to someone famous outside golf would let unrelated stories in.
 */
const GOLF_NAMES =
  /\b(?:McIlroy|Scheffler|DeChambeau|Rahm|Koepka|Spieth|Schauffele|Fitzpatrick|Hovland|Åberg|Aberg|Fleetwood|Fowler|Mickelson|Morikawa|Tiger Woods|Nelly Korda|Lydia Ko|Jin Young Ko|Charley Hull|Lexi Thompson|Rose Zhang|Jeeno Thitikul)\b/i;

function countMatches(re: RegExp, text: string): number {
  return text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`))?.length ?? 0;
}

/**
 * "Is this story really about golf?" Kept when the headline has a golf word or
 * a golf name, or the description names a tour or calls someone a golfer, or
 * the whole text has at least two golf words. One passing golf word in the
 * description ("practising a golf swing", "the Birdie concession stand") is how
 * celebrity, politics and other-sport stories used to slip in.
 */
export function isAboutGolf(a: StoryText): boolean {
  if (countMatches(GOLF_TERMS, a.title) > 0 || GOLF_NAMES.test(a.title)) return true;
  const description = a.description ?? "";
  if (STRONG_GOLF_TERMS.test(description)) return true;
  return countMatches(GOLF_TERMS, `${a.title} ${description}`) >= 2;
}

/**
 * Section rules, tested on the headline only, first match wins; no match keeps
 * the pool's section. Descriptions mention majors, LIV and golf courses in
 * passing all the time ("since the PGA Championship", "the LIV defector"), so
 * matching them filled Majors with a third of the feed.
 */
const GOLF_SECTION_RULES: Array<[RegExp, string]> = [
  [
    // "BMW PGA Championship" is a DP World Tour event, and "major" alone is
    // usually an adjective ("major coup"), so neither counts.
    /\b(?:the Masters|Masters (?:champion|winner|week|field|odds|preview|picks)|Augusta(?: National)?|green jacket|Open Championship|British Open|The Open \d{4}|U\.?S\.? (?:Women'?s )?Open|(?<!BMW )PGA Championship|Women'?s PGA|Chevron Championship|Evian Championship|AIG Women'?s Open|majors|major (?:title|championship|champion|win|winner|record)s?)\b/i,
    "Majors",
  ],
  [
    // Bare "driver", "irons" or "grips" are usually something else ("drunk driver").
    /\b(?:(?:new|best|forgiving|longest) (?:drivers?|irons?|wedges?|putters?)|putters?|golf (?:balls?|bags?|shoes|equipment|gear)|equipment|gear|launch monitors?|club (?:review|test|fitting)|TaylorMade|Titleist|Callaway|Mizuno|Srixon|Odyssey|Scotty Cameron)\b/i,
    "Equipment & Gear",
  ],
  [
    // "Tips" alone is often a verb ("Luke Combs Tips Big").
    /\b(?:(?:golf|swing|putting|chipping|driving|bunker|top|best|easy|simple|\d+) tips|tips (?:for|to|from)|drills?|how to (?:hit|fix|play|putt|chip|swing|break|improve)|lessons?|instruction|swing (?:thoughts?|changes?|coach)|short game|fix your)\b/i,
    "Instruction & Tips",
  ],
  [
    /\b(?:golf (?:course|resort|trip|travel|destination|club)s?|(?:links|public|municipal|best|new|top|championship) courses?|course (?:design|architect|redesign|renovation|record)|resorts?|clubhouse|green fees?|where to play)\b/i,
    "Courses & Travel",
  ],
  [
    /\b(?:LIV|PIF|TGL|merger|sponsor(?:s|ship)?|media rights|TV rights|broadcast (?:deal|rights)|revenue|earnings|net sales|investment|acquisition|lawsuit|bankruptcy|CEO|prize money|purse|payout)\b/i,
    "Golf Business",
  ],
];

/** The more specific section for a story, or null to keep the pool's section. */
export function golfSectionOf(a: StoryText): string | null {
  return GOLF_SECTION_RULES.find(([re]) => re.test(a.title))?.[1] ?? null;
}
