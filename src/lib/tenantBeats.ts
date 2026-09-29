// Editorial beat per tenant. General Publish feeds this to the paraphrase step so
// each site's copy of a shared story is reframed for its own audience instead of
// being a reworded duplicate of the same article.
const TENANT_BEATS: Record<string, string> = {
  "linktechnews.com": "a fast technology news wire: lead with what happened and why it is newsworthy today, keep it tight and factual",
  "dbtechnews.com": "infrastructure, data, and the systems that run everything else: emphasize the technical, data, and infrastructure implications for engineers and operators",
  "magazinetechy.com": "long-form looks at the people and ideas shaping technology: emphasize the people, motivations, and bigger ideas behind the story",
  "magazineair.com": "technology explained lightly for a general reader: plain language, what it is and why it matters to an everyday person",
  "techygate.com": "a daily gateway to technology: practical takeaways and what a reader should know or do today",
  "newyorksignal.com": "dispatches on technology from New York City: emphasize the city angle, its companies, people, and the local pulse of the tech industry where the facts support it",
  "lavaguetech.com": "the next wave of technology news: sharp insights and bold perspectives on where technology is heading",
  "skyblueprime.com": "premium news and analysis: clear, well-reasoned reporting for a connected world, with context on why the story matters",
  "legalhyper.com": "AI transforming the practice of law: emphasize implications for lawyers, law firms, and legal operations",
  // Non-English tenants are also translated; the beat only steers framing.
  "technikpost.de": "technology, digital policy, and business, reported daily with a European (Berlin and Brussels) and Silicon Valley perspective",
  "techoggi.com": "the day's essential technology news in brief: concise, clear summaries of what matters today",
  "techhoy.com": "the day's technology news for a Spanish-speaking audience: clear, accessible, and relevant to readers today",
};

export function getTenantBeat(domain: string): string | undefined {
  return TENANT_BEATS[domain.toLowerCase()];
}
