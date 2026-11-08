import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SoloRefereeClient } from "@/features/solo-match/domain/solo-referee-client";
import {
  ParticipantStreamStatus,
  SoloChallengeType,
  StreamSoloMatchTrackingRequestSchema,
  StreamSoloMatchTrackingResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

class FakeWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  binaryType = "blob";
  readyState = FakeWebSocket.OPEN;
  sentPayloads: Uint8Array[] = [];
  url: string;

  onopen: (() => void) | null = null;
  onmessage: ((evt: { data: ArrayBuffer }) => void) | null = null;
  onerror: ((evt: unknown) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
    queueMicrotask(() => {
      if (this.readyState === FakeWebSocket.OPEN) {
        this.onopen?.();
      }
    });
  }

  send(data: Uint8Array): void {
    this.sentPayloads.push(new Uint8Array(data));
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }

  simulateServerMessage(bytes: Uint8Array): void {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    this.onmessage?.({ data: copy.buffer });
  }

  simulateUnexpectedDrop(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe(SoloRefereeClient, () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).WebSocket = FakeWebSocket;
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        certHashBase64: "",
        soloFallbackPath: "/api/v1/execution/solo-stream",
        soloUrl: "https://localhost:8443/api/v1/execution/solo-wt",
        token: "jwt-solo-token",
        url: "https://localhost:8443/api/v1/execution/wt",
      }),
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    globalThis.fetch = originalFetch;
  });

  it("sends SoloTrackingConfig on connect and exchanges binary frame, submit, and abort payloads", async () => {
    const receivedResponses = [];
    const client = new SoloRefereeClient();

    await client.connect({
      cameraAngle: "side",
      challengeType: SoloChallengeType.REPS,
      exerciseId: "ex-pushup",
      matchId: "match-101",
      onResponse: (resp) => receivedResponses.push(resp),
      timeCeilingSeconds: 300,
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    const ws = FakeWebSocket.instances[0]!;
    expect(ws.url).toContain("/api/v1/execution/solo-stream");
    expect(ws.url).toContain("token=jwt-solo-token");

    // 1. Verify initial config message was sent immediately
    expect(ws.sentPayloads).toHaveLength(1);
    const initMsg = fromBinary(StreamSoloMatchTrackingRequestSchema, ws.sentPayloads[0]!);
    expect(initMsg.payload.case).toBe("config");
    if (initMsg.payload.case === "config") {
      expect(initMsg.payload.value.matchId).toBe("match-101");
      expect(initMsg.payload.value.exerciseId).toBe("ex-pushup");
      expect(initMsg.payload.value.challengeType).toBe(SoloChallengeType.REPS);
      expect(initMsg.payload.value.timeCeilingSeconds).toBe(300);
    }

    // 2. Send a pose frame
    await client.sendFrame([
      { score: 0.95, x: 0.42, y: 0.51 },
      { score: 0.88, x: 0.45, y: 0.62 },
    ]);
    expect(ws.sentPayloads).toHaveLength(2);
    const frameMsg = fromBinary(StreamSoloMatchTrackingRequestSchema, ws.sentPayloads[1]!);
    expect(frameMsg.payload.case).toBe("frame");
    if (frameMsg.payload.case === "frame") {
      expect(frameMsg.payload.value.landmarks).toHaveLength(2);
    }

    // 3. Simulate server response with live duel telemetry
    const serverResp = toBinary(
      StreamSoloMatchTrackingResponseSchema,
      create(StreamSoloMatchTrackingResponseSchema, {
        audioCue: "Great depth!",
        currentAngle: 88,
        isCompleted: false,
        isValidForm: true,
        matchEnded: false,
        myConfirmedValue: 12,
        myFormScore: 96,
        myStatus: ParticipantStreamStatus.ACTIVE,
        opponentFormScore: 91,
        opponentStatus: ParticipantStreamStatus.ACTIVE,
        opponentValue: 10,
        personDetected: true,
        remainingCeilingSeconds: 245,
        repPhase: "active",
      }),
    );
    ws.simulateServerMessage(serverResp);

    expect(receivedResponses).toHaveLength(1);
    expect(receivedResponses[0]?.myConfirmedValue).toBe(12);
    expect(receivedResponses[0]?.opponentValue).toBe(10);
    expect(receivedResponses[0]?.remainingCeilingSeconds).toBe(245);

    // 4. Send submit signal
    await client.submit();
    const submitMsg = fromBinary(StreamSoloMatchTrackingRequestSchema, ws.sentPayloads[2]!);
    expect(submitMsg.payload.case).toBe("submit");

    // 5. Send abort signal
    await client.abort("USER_FORFEITED");
    const abortMsg = fromBinary(StreamSoloMatchTrackingRequestSchema, ws.sentPayloads[3]!);
    expect(abortMsg.payload.case).toBe("abort");
    if (abortMsg.payload.case === "abort") {
      expect(abortMsg.payload.value.reason).toBe("USER_FORFEITED");
    }

    client.close();
  });

  it("automatically reconnects within the grace window when socket drops before matchEnded", async () => {
    const reconnectAttempts: number[] = [];
    const client = new SoloRefereeClient();

    await client.connect({
      exerciseId: "ex-squat",
      matchId: "match-reconnect-1",
      onReconnecting: (attempt) => reconnectAttempts.push(attempt),
      onResponse: () => {},
      reconnectDelaysMs: [15, 30],
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    FakeWebSocket.instances[0]!.simulateUnexpectedDrop();

    expect(reconnectAttempts).toEqual([1]);

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(2);
    const reconnectedWs = FakeWebSocket.instances[1]!;
    expect(reconnectedWs.sentPayloads).toHaveLength(1);
    const reInit = fromBinary(StreamSoloMatchTrackingRequestSchema, reconnectedWs.sentPayloads[0]!);
    expect(reInit.payload.case).toBe("config");

    // Now simulate matchEnded = true, after which dropping does not reconnect
    reconnectedWs.simulateServerMessage(
      toBinary(
        StreamSoloMatchTrackingResponseSchema,
        create(StreamSoloMatchTrackingResponseSchema, {
          matchEnded: true,
          myConfirmedValue: 25,
          myStatus: ParticipantStreamStatus.COMPLETED,
          opponentStatus: ParticipantStreamStatus.COMPLETED,
          opponentValue: 20,
        }),
      ),
    );

    const countBeforeFinalClose = FakeWebSocket.instances.length;
    reconnectedWs.simulateUnexpectedDrop();
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(FakeWebSocket.instances).toHaveLength(countBeforeFinalClose);

    client.close();
  });
});
