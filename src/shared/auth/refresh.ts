import { createClient } from "@connectrpc/connect";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

// Single-flight deduplication map for concurrent token refresh operations
const refreshFlightMap = new Map<
  string,
  Promise<{ accessToken: string; refreshToken: string }>
>();

/**
 * Deduplicated token refresh operation.
 * Ensures concurrent requests with the same refresh token trigger only one upstream RPC call.
 */
export async function refreshSessionTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  let flight = refreshFlightMap.get(refreshToken);
  if (!flight) {
    flight = (async () => {
      try {
        const authClient = createClient(AuthService, createServerTransport());
        const refreshed = await authClient.refreshToken({ refreshToken });
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        };
      } finally {
        refreshFlightMap.delete(refreshToken);
      }
    })();
    refreshFlightMap.set(refreshToken, flight);
  }
  return flight;
}
