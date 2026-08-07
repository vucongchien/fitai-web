import { recordServerError } from "@/shared/observability/tracer";

/**
 * Next.js Instrumentation Hook (Khởi tạo 1 lần duy nhất khi server boot up)
 * Chi tiết: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Chỉ chạy OpenTelemetry SDK trên môi trường Node.js Server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } =
      await import("@opentelemetry/semantic-conventions");

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "forange-app",
        [ATTR_SERVICE_VERSION]: "0.1.0",
      }),
    });

    try {
      sdk.start();
      console.log("[Instrumentation] OpenTelemetry SDK initialized successfully.");
    } catch (error) {
      console.error("[Instrumentation] Failed to initialize OpenTelemetry SDK:", error);
    }
  }
}

/**
 * Next.js onRequestError Hook
 * Tự động bắt tất cả các unhandled server-side errors (Server Components, Server Actions, Route Handlers)
 */
export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: "Pages" | "App";
    routePath: string;
    dir?: string;
  },
) {
  recordServerError(err, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
  });
}
