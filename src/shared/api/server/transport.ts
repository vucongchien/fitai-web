import type { Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

const traceInterceptor: Interceptor = (next) => async (request) => {
  request.header.set("x-fitai-request-id", crypto.randomUUID());
  return next(request);
};

export function createServerTransport(accessToken?: string) {
  const baseUrl = process.env.FITAI_RPC_URL;
  if (!baseUrl) {
    throw new Error("FITAI_RPC_URL is not configured.");
  }

  const authInterceptor: Interceptor = (next) => async (request) => {
    if (accessToken) {
      request.header.set("authorization", `Bearer ${accessToken}`);
    }
    return next(request);
  };

  return createConnectTransport({
    baseUrl,
    interceptors: [traceInterceptor, authInterceptor],
    useBinaryFormat: true,
  });
}
