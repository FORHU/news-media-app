/**
 * Renders one or more schema.org JSON-LD blocks as <script> tags.
 * Server-safe and emits no client-side JavaScript.
 */
type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function JsonLd({ data }: JsonLdProps) {
  const blocks = Array.isArray(data) ? data : [data];

  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Escape "<" so a stray string field can never break out of the
          // <script> element or inject markup.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
