---
name: PressBig
description: The day's edit as a poster hoarding torn back by hand; four inks on chalk paper over paste-gray backing.
colors:
  chalk: "#f2efe6"
  poster-black: "#1a1a1a"
  faded-indigo: "#445c7a"
  paper-red: "#b34a4a"
  wheat-paste: "#dbc26b"
  paste-gray: "#b8b6ad"
  red-ink-text: "#8f3636"
  soft-ink: "#3b3b38"
typography:
  display:
    fontFamily: "Anton, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(6.5rem, 12.5vw, 11.5rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "0"
  headline:
    fontFamily: "Anton, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(3.25rem, 13vw, 7.5rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "0"
  title:
    fontFamily: "Gloock, Georgia, Times New Roman, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.18
  body:
    fontFamily: "Spline Sans Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  reading:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Spline Sans Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  none: "0"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  section: "clamp(3rem, 6vw, 5rem)"
  gutter: "clamp(1rem, 4vw, 3rem)"
components:
  strip-primary:
    backgroundColor: "{colors.faded-indigo}"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.9rem 1.5rem"
    height: "3rem"
  strip-primary-active:
    backgroundColor: "{colors.poster-black}"
  strip-ghost:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.poster-black}"
    typography: "{typography.label}"
    padding: "0.9rem 1.5rem"
  strip-red:
    backgroundColor: "{colors.paper-red}"
    textColor: "{colors.chalk}"
  strip-wheat:
    backgroundColor: "{colors.wheat-paste}"
    textColor: "{colors.poster-black}"
  tag:
    backgroundColor: "{colors.poster-black}"
    textColor: "{colors.chalk}"
    padding: "0.25rem 0.55rem"
  scrap:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.poster-black}"
    typography: "{typography.title}"
    padding: "0.75rem 0.75rem 1rem"
  band-sheet:
    backgroundColor: "{colors.poster-black}"
    textColor: "{colors.chalk}"
    padding: "clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem)"
---

# Design System: PressBig

## Overview

**Creative North Star: "The Torn Hoarding"**

PressBig is the day's edit drawn as a poster hoarding that someone has torn back by hand. Today's picks sit on the top layer of chalk paper; the tear exposes the four section layers pasted up beneath, each in its own ink. The ground is paste-gray backing with a faint ink speckle, and everything that holds content is a sheet of paper with a fibrous, uneven edge. The effect is loud, tactile and pop-culture, but the structure is a curated edit: a few pasted picks per layer, never a feed.

The system is built from four inks only (poster black, faded indigo, paper red, wheat paste) on chalk over paste-gray. Display lettering is a heavy condensed grotesque (Anton) in uppercase; a bookish serif (Gloock) carries story headlines; mono (Spline Sans Mono) carries body, captions and controls; Source Serif 4 is reused only for long-form reading. Surfaces are square, flat-colored and slightly rotated. Depth is paper lift, not UI shadow.

**Key Characteristics:**
- Torn edges on every container, button and band, made by SVG turbulence displacement, never by border-radius.
- Four inks on chalk; each of the four sections owns one ink.
- Halftone, grayscale-and-tint pictures that resolve to full color on hover or focus.
- Small, deliberate rotations (about 0.3 to 3 degrees) so the wall reads as hand-pasted.
- Rectilinear and square: radius is zero everywhere.
- One authored motion moment: strips pulled out from behind the tear on load.

## Colors

A restrained poster palette: one warm paper, one near-black, two muted mid-tones and a paste yellow, all slightly dusty.

### Primary
- **Poster Black** (`#1a1a1a`): body ink, the Entertainment layer, footer sheet, drawer ground, focus outline, tag chips and torn-strip hover/active state.
- **Faded Indigo** (`#445c7a`): default torn-strip button, Fashion & Style layer, metadata text, links in reading text, active nav underline, input placeholders.

### Secondary
- **Paper Red** (`#b34a4a`): the Gadgets layer, the BIG strip in the wordmark, the third headline line, primary call to action strips ("Get the edit"), text selection, caret, hover on nav underline, input focus underline.

### Tertiary
- **Wheat Paste** (`#dbc26b`): the Celebrity & Culture layer, secondary strip on the chalk hero sheet, footer headings and footer strip, selected-chip fill.

### Neutral
- **Chalk** (`#f2efe6`): the top sheet: header, hero sheet, scraps, article sheet, ad cut-outs, modal card; also the fibrous core that peeks out around every torn sheet.
- **Paste Gray** (`#b8b6ad`): page backing behind all sheets, halftone picture ground, disabled strips, share-item default paper.
- **Red Ink Text** (`#8f3636`): a darkened red used only for small text on chalk (source label in scrap meta, form error), because paper red is too light there.
- **Soft Ink** (`#3b3b38`): scrap description text and disabled-strip text.

### Named Rules
**The Four Inks Rule.** Every filled surface is chalk, gray, or one of black, indigo, red, wheat. No gradients, no off-palette brand colors (share-icon brand colors are flattened to one-ink silhouettes).
**The Section Ink Rule.** Entertainment is black, Fashion & Style is indigo, Gadgets is red, Celebrity & Culture is wheat, everywhere that section appears (hero strips, bands, picture tint).
**The Chalk Text Rule.** Text on black, indigo and red paper is chalk; text on wheat and chalk is black.

## Typography

**Display Font:** Anton (with Arial Narrow, Helvetica Neue, sans-serif)
**Body Font:** Spline Sans Mono (with ui-monospace, SFMono-Regular, Menlo, monospace)
**Story/Contrast Serif:** Gloock (with Georgia, Times New Roman, serif)
**Reading Font:** Source Serif 4 (with Georgia), article body only

**Character:** Billboard lettering against typewriter captions, with one bookish serif for story headlines. Anton is always uppercase and tightly leaded; the mono keeps small text legible and a little clerical.

### Hierarchy
- **Display** (Anton 400, clamp(6.5rem, 12.5vw, 11.5rem) desktop, clamp(5rem, 22vw, 7.5rem) phone, 0.88): the home hero headline, stacked in black, indigo, red.
- **Headline** (Anton 400, clamp(3.25rem, 13vw, 7.5rem), 0.88): section band names; page titles use clamp(3rem, 12vw, 7rem); layer names on hero strips clamp(2.4rem, 11vw, 4.2rem) (to 4.25rem on desktop).
- **Title** (Gloock 400, 1.25rem, 1.18; lead 1.75rem to 2rem, hero scraps 1.05 to 1.2rem clamped to three lines): story headlines on scraps; article dek is Gloock 1.1875rem/1.5.
- **Body** (Spline Sans Mono 400, 0.9375rem, 1.55): lede, descriptions (0.8125rem), search input (1.25rem).
- **Reading** (Source Serif 4 400, 1.1875rem, 1.75, max 42rem): article prose only; in-article h2 return to Anton 2rem uppercase.
- **Label** (Spline Sans Mono 700, 0.6875 to 0.875rem, 0.1 to 0.16em tracking, uppercase): strips, nav, tags, meta, counts.

### Named Rules
**The Anton Is Loud Rule.** Display is Anton, uppercase, line-height 0.88, letter-spacing 0, and only for names of things (sections, page titles, the headline). Never for sentences of running copy.
**The Mono Is Small Rule.** Mono carries labels and body; it is always uppercase and tracked when 0.875rem or smaller and bold.

## Layout

A poster wall: full-bleed sheets stacked vertically with negative margins (bands overlap by 1.25rem) so layers read as pasted over each other. Content is capped at 1680px (`pb-band__inner`, header bar, footer grid) and article sheets at 62rem; reading text at 42rem. Page gutter is fluid (`clamp(1rem, 4vw, 3rem)`); section padding `clamp(3rem, 6vw, 5rem)`. Grid gaps are 1.5rem for scrap walls, 0.85 to 1rem for stacked strips.

First viewport at 900px and up is a 52/48 split: chalk hero sheet left (overlapping the tear by 2.5rem), the four section strips right, three scraps absolutely placed across the tear. Below 900px it collapses to one column with the scraps in a horizontal snap scroller.

Band walls are 1 column, then 2 (640px), 3 (900px), 4 (1280px); the first scrap is a large lead spanning two columns. Bands are not one template: variant 2 mirrors the lead to the right, variant 3 makes the lead a wide landscape strip, variant 4 drops every other scrap by 2.5rem. Search and section pages use a dense 2/3/4 column wall with a double-width lead. Footer grid is 5fr 3fr 3fr 4fr from 900px.

Breakpoints in use: 640px, 768px (header newsletter strip appears), 900px (desktop nav, hero split, filters hidden), 1280px, 1380px (article gutter ad rails). Header height is 4.5rem and sticky.

## Elevation & Depth

Depth comes from stacking and paper lift, not from UI shadows. Sheets overlap, carry a chalk fibrous core around their torn edge, and a few lifted items (hero scraps, ad cut-outs) use a soft contour-following `drop-shadow(0 6px 9px rgba(26,26,26,0.3))` so the shadow follows the torn edge. Portaled dialogs use a deeper `drop-shadow(0 16px 24px rgba(26,26,26,0.5))`. There are no box-shadows, no hard offset shadows and no blur glass. The one box-shadow in the system is the focus halo: `0 0 0 3px chalk` beside a 3px black outline.

### Named Rules
**The Paper Lift Rule.** The only shadow is a `drop-shadow` filter on a torn sheet. Never put `box-shadow` on a torn element, because it would draw a straight rectangle under a ragged edge.

## Shapes

Zero radius everywhere; shape comes from torn edges. The technique: a `.pb-paper` element draws two pseudo-elements. `::before` is a chalk layer inset by about 5px (3 to 7px by component) displaced by the `pb-fiber` filter (feTurbulence fractalNoise, baseFrequency 0.03 0.06, 5 octaves, seed 11, displacement scale 24) at z-index -2; `::after` is the colored sheet (`--paper`) over a faint grain image, displaced by `pb-tear` (baseFrequency 0.012 0.022, 4 octaves, seed 4, scale 15) at -1. The two filters are defined once in `<PaperDefs/>` rendered by the header. The filter is never put on the element itself, only on its pseudo-elements, so the text stays crisp. The same recipe is re-declared for `.pb-scrap`, `.pb-nl-btn`, `.pb-share` and `.pb-share-item` where `.pb-paper` cannot be applied (position conflicts or portals).

Other recurring forms: 2px and 3px solid black rules (lede divider, article meta, input underlines, nav underline); square 0.6rem wheat dot with 2px black border; halftone pictures at 3 / 2 aspect ratio; small rotations on scraps, bands, headers and strips.

## Components

### Buttons (torn strips)
- **Shape:** a torn paper strip, min-height 3rem (2.5 to 2.75rem compact), padding 0.9rem 1.5rem, no radius.
- **Primary:** indigo paper, chalk text, Spline Sans Mono 700 0.875rem, 0.1em tracking, uppercase. Variants swap the ink: red (calls to action such as "Get the edit"), black (closing "Browse every story"), ghost (chalk paper, black text, section links), wheat (secondary on the chalk hero sheet and on the footer).
- **Hover / Focus:** lifts 2px and rotates -0.7deg (250ms, `cubic-bezier(0.16, 1, 0.3, 1)`). Active: paper goes black (ghost goes gray) and settles flat. Focus-visible: 3px black outline, 3px offset, chalk halo.
- **Icon buttons:** 2.75rem square, no fill, hover turns red.

### Tags
Black chip, chalk 700 mono 0.6875rem, 0.14em tracking, uppercase; used for the "Advertisement" label on ad cut-outs.

### Scraps (story cards)
Chalk torn sheet, 0.75rem padding, a halftone picture on top, Gloock headline, optional description, mono meta line (source in red ink text, date in indigo). Alternate rotations by position (about -0.9 and 0.8 degrees); hover lifts 5px and straightens. The picture is grayscale with 1.25 contrast, multiplied by the section ink at 60%, with a 4px dot screen over it; on hover or focus the picture goes to full color and the overlays fade (400ms).

### Section bands and layer strips
Full-width torn sheets in a section ink (`pb-paper--black|indigo|red|wheat`) with an Anton section name, a mono note and a ghost "See all" strip; hero layer strips are the same paper with a giant Anton name, pulled out on load and nudged left 0.75rem on hover.

### Navigation
Chalk torn header (sticky, 4.5rem) with a wordmark (PRESS in black, BIG on a torn red strip, Anton 2rem). Desktop nav: mono 700 0.75rem uppercase, 0.12em tracking, 3px bottom border that turns red on hover and indigo for the current page. Below 900px: a full-screen black drawer sliding down in 500ms with Anton links 3rem to 5.5rem in alternating chalk, wheat and gray. Search opens as a torn chalk bar below the header with a mono input and a 3px black underline that turns red on focus.

### Inputs
Transparent (or 7% black fill in dialogs), square, 3px black bottom border only, mono, indigo placeholder; focus swaps the underline to red, no outline.

### Portaled surfaces (newsletter modal, share dialog, ads)
The modal and dialog render outside `.pb`, so `.pb-nl` and `.pb-share` re-declare the six ink tokens, display and mono families, and grain. The newsletter card is a torn chalk sheet with a tilted (-0.5deg) black torn header, Anton titles, torn-strip buttons (`pb-nl-btn`, wheat ghost variant, gray when disabled) and outlined square chips that fill wheat when selected; Tailwind utility colors inside it are overridden to black and radii to zero. The share dialog is a torn chalk sheet with a 2.6rem Anton title and gray torn share items that turn indigo on hover; brand icons are flattened with `filter: brightness(0)` (inverted on hover). Ads are chalk cut-out scraps with a torn edge, a black "Advertisement" tag, paper lift and a slight tilt, shown in the article gutters only at 1380px and up, sticky below the header.

### Cascade note
Tailwind utilities sit in a lower cascade layer than `pressbig.css`, so these rules intentionally win over utility classes on shared components (modal, share dialog). Do not add `!important` to beat utilities; the layer order already handles it.

## Do's and Don'ts

### Do:
- **Do** build every container, button and band as a `.pb-paper` sheet with `--paper` set to one of the six inks; put the filters on the pseudo-elements only.
- **Do** keep radius at zero and let the torn edge be the shape.
- **Do** tie each section to its ink (black, indigo, red, wheat) and tint its pictures with it.
- **Do** use Anton uppercase for names, Gloock for story headlines, mono for labels and body, Source Serif 4 for article prose.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for all transitions, 250 to 500ms, and honor `prefers-reduced-motion` (animations off, transitions near-zero).
- **Do** use red ink text (`#8f3636`) for small red text on chalk.
- **Do** keep a visible focus ring: 3px black outline, 3px offset, 3px chalk halo.

### Don't:
- **Don't** use gradients, rounded corners, glassmorphism or box-shadow on torn elements.
- **Don't** add colors beyond the four inks, chalk and gray (the two derived text tones excepted); flatten third-party brand colors to one ink.
- **Don't** apply the SVG filter to the element itself; it would distort its text.
- **Don't** build the hero plus three-column equal-card grid; vary lead size, rotation and stagger.
- **Don't** animate layout or content on scroll; the pull-out on load is the only authored motion, and content stays visible by default.
