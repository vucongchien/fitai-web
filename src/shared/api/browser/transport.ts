"use client";

import { createConnectTransport } from "@connectrpc/connect-web";

let transport: ReturnType<typeof createConnectTransport> | undefined;

export function getBrowserTransport() {
  transport ??= createConnectTransport({
    baseUrl: `${window.location.origin}/rpc`,
    useBinaryFormat: true,
  });
  return transport;
}
