import { serializeJsonLd } from "@/shared/seo/structured-data";

function buildJsonLdHtml(data: unknown): { __html: string } {
  return { __html: serializeJsonLd(data) };
}

interface JsonLdScriptProps {
  data: unknown;
}

function JsonLdScript({ data }: JsonLdScriptProps) {
  const innerHtml = buildJsonLdHtml(data);
  return <script dangerouslySetInnerHTML={innerHtml} type="application/ld+json" />;
}

export { JsonLdScript };
