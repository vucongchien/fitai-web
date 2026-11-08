import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { mapProtoMatchToSummary } from "@/features/solo-match/domain/match-state";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { MatchStreamEventType } from "@/shared/api/gen/contracts/core/solo_match/v1/message/match_message_pb";
import { SoloMatchService } from "@/shared/api/gen/contracts/core/solo_match/v1/service/solo_match_service_pb";

export function createSoloMatchBrowserClient() {
  const transport = createConnectTransport({
    baseUrl: "/rpc",
    useBinaryFormat: true,
  });
  return createClient(SoloMatchService, transport);
}

export interface StreamJoinQueueCallbacks {
  onCancelled: (message: string) => void;
  onMatched: (match: SoloMatchSummary) => void;
  onQueued: (elapsedSeconds: number, message: string) => void;
  onTimeout: (message: string) => void;
  signal: AbortSignal;
}

export async function streamJoinQueue({
  onCancelled,
  onMatched,
  onQueued,
  onTimeout,
  signal,
}: StreamJoinQueueCallbacks): Promise<void> {
  const client = createSoloMatchBrowserClient();
  const stream = client.joinQueue({}, { signal });

  for await (const event of stream) {
    if (signal.aborted) {
      return;
    }
    switch (event.type) {
      case MatchStreamEventType.QUEUED: {
        onQueued(event.elapsedSeconds ?? 0, event.message || "Searching for an opponent...");
        break;
      }
      case MatchStreamEventType.MATCHED: {
        if (event.match) {
          onMatched(mapProtoMatchToSummary(event.match));
        }
        return;
      }
      case MatchStreamEventType.CANCELLED: {
        onCancelled(event.message || "Matchmaking cancelled");
        return;
      }
      case MatchStreamEventType.TIMEOUT: {
        onTimeout(event.message || "Matchmaking timed out");
        return;
      }
      default: {
        break;
      }
    }
  }
}

export async function fetchActiveMatchClient(): Promise<SoloMatchSummary | null> {
  const client = createSoloMatchBrowserClient();
  const response = await client.getActiveMatch({});
  return response.match ? mapProtoMatchToSummary(response.match) : null;
}

export async function fetchMatchByIdClient(matchId: string): Promise<SoloMatchSummary | null> {
  const client = createSoloMatchBrowserClient();
  const response = await client.getMatch({ matchId });
  return response.match ? mapProtoMatchToSummary(response.match) : null;
}

export async function cancelMatchQueueClient(ticketId = ""): Promise<boolean> {
  const client = createSoloMatchBrowserClient();
  const response = await client.cancelQueue({ ticketId });
  return Boolean(response.success);
}
