import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";

import { isAllowedRpcPath } from "@/shared/api/bff/allowed-services";
import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { recordServerError } from "@/shared/observability/tracer";

export const runtime = "nodejs";

const forwardedRequestHeaders = [
  "accept",
  "connect-protocol-version",
  "connect-timeout-ms",
  "content-encoding",
  "content-type",
  "grpc-encoding",
  "grpc-timeout",
  "x-grpc-web",
] as const;

const forwardedResponseHeaders = [
  "connect-accept-encoding",
  "connect-content-encoding",
  "content-encoding",
  "content-type",
  "grpc-encoding",
  "grpc-message",
  "grpc-status",
  "trailer",
  "x-trace-id",
] as const;

function forbidden(message: string) {
  return Response.json({ code: "permission_denied", message }, { status: 403 });
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin)
    return forbidden("Cross-origin RPC requests are not allowed.");

  const { path: segments } = await context.params;
  const rpcPath = segments.join("/");
  if (!isAllowedRpcPath(rpcPath)) return forbidden("This RPC is not exposed through the web BFF.");

  const upstreamBase = process.env.FITAI_RPC_URL;
  if (!upstreamBase) {
    return Response.json(
      {
        code: "unavailable",
        message: "FITAI_RPC_URL is not configured. The interface is running with preview data.",
      },
      { status: 503 },
    );
  }

  const requestHeaders = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("fitai_access_token")?.value;
  const refreshToken = cookieStore.get("fitai_refresh_token")?.value;
  requestHeaders.set("x-fitai-request-id", crypto.randomUUID());

  try {
    const body = await request.arrayBuffer();
    const send = (token?: string) => {
      const headers = new Headers(requestHeaders);
      if (token) headers.set("authorization", `Bearer ${token}`);
      return fetch(`${upstreamBase.replace(/\/$/, "")}/${rpcPath}`, {
        body,
        cache: "no-store",
        headers,
        method: "POST",
        signal: request.signal,
      });
    };

    let upstream = await send(accessToken);

    if (upstream.status === 401 && refreshToken) {
      const authClient = createClient(AuthService, createServerTransport());
      const refreshed = await authClient.refreshToken({ refreshToken });
      accessToken = refreshed.accessToken;
      cookieStore.set("fitai_access_token", refreshed.accessToken, {
        httpOnly: true,
        maxAge: 60 * 15,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      cookieStore.set("fitai_refresh_token", refreshed.refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      upstream = await send(accessToken);
    }

    const responseHeaders = new Headers();
    for (const name of forwardedResponseHeaders) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new Response(upstream.body, {
      headers: responseHeaders,
      status: upstream.status,
      statusText: upstream.statusText,
    });
  } catch (error) {
    recordServerError(error, { rpcPath });
    return Response.json(
      { code: "unavailable", message: "The training service could not be reached." },
      { status: 503 },
    );
  }
}
