type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Injects JSON-LD structured data for search engines. */
export default function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graphs.length === 1 ? graphs[0] : graphs) }}
    />
  );
}
