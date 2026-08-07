import { SpanStatusCode, trace } from "@opentelemetry/api";

type ErrorAttributes = Record<string, boolean | number | string | undefined>;

export function recordServerError(error: unknown, attributes: ErrorAttributes = {}) {
  const span = trace.getActiveSpan();
  const normalized = error instanceof Error ? error : new Error(String(error));

  if (span) {
    span.recordException(normalized);
    span.setStatus({ code: SpanStatusCode.ERROR, message: normalized.message });
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {span.setAttribute(`fitai.${key}`, value);}
    }
    return;
  }

  console.error("[FITAI] Unhandled server error", {
    ...attributes,
    message: normalized.message,
  });
}
