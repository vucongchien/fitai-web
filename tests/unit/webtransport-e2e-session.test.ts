import { describe, expect, it, vi } from "vitest";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";

import {
  WebTransportRefereeClient,
} from "@/features/workout/domain/webtransport-client";
import {
  StreamSoloMatchTrackingRequestSchema,
  StreamSoloMatchTrackingResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

describe("WebTransportRefereeClient End-to-End WebSocket Session", () => {
  it("completes full session: config handshake -> frame telemetry -> rep count -> submit", async () => {
    // Mock global fetch for wt-config
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL) => {
      if (input.toString().includes("/api/execution/wt-config")) {
        return new Response(
          JSON.stringify({
            fallback_path: "/api/v1/execution/wt-stream",
            url: "https://localhost:8443/api/v1/execution/wt",
            token: "mock-jwt-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(input);
    };

    // Mock WebSocket class
    class MockWebSocket {
      static OPEN = 1;
      static CLOSED = 3;
      binaryType = "arraybuffer";
      readyState = 1; // OPEN
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: ArrayBuffer }) => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      onclose: (() => void) | null = null;
      private repCount = 0;

      constructor(public url: string) {
        setTimeout(() => this.onopen?.(), 10);
      }

      send(data: Uint8Array | ArrayBuffer) {
        const raw = new Uint8Array(data as ArrayBuffer);
        const req = fromBinary(StreamSoloMatchTrackingRequestSchema, raw);

        if (req.payload.case === "config") {
          setTimeout(() => {
            const resp = create(StreamSoloMatchTrackingResponseSchema, {
              myConfirmedValue: 0,
              currentAngle: 160,
              repPhase: "start",
              myFormScore: 100,
              detectedErrors: [],
              personDetected: true,
            });
            const bytes = toBinary(StreamSoloMatchTrackingResponseSchema, resp);
            const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            this.onmessage?.({ data: ab });
          }, 10);
        } else if (req.payload.case === "frame") {
          const frame = req.payload.value;
          const wrist = frame.landmarks.find((l) => l.landmarkIndex === 9 || l.landmarkIndex === 10);
          const isFlexed = (wrist?.y ?? 100) < 50;

          if (isFlexed && this.repCount === 0) {
            this.repCount = 1;
          }

          setTimeout(() => {
            const resp = create(StreamSoloMatchTrackingResponseSchema, {
              myConfirmedValue: this.repCount,
              currentAngle: isFlexed ? 45 : 150,
              repPhase: isFlexed ? "bottom" : "start",
              myFormScore: 98,
              detectedErrors: isFlexed ? ["elbow_sway"] : [],
              audioCue: isFlexed ? "bicep_curl_elbow_sway_cue" : "",
              personDetected: true,
            });
            const bytes = toBinary(StreamSoloMatchTrackingResponseSchema, resp);
            const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            this.onmessage?.({ data: ab });
          }, 10);
        } else if (req.payload.case === "submit") {
          setTimeout(() => {
            const resp = create(StreamSoloMatchTrackingResponseSchema, {
              myConfirmedValue: this.repCount,
              currentAngle: 160,
              repPhase: "completed",
              myFormScore: 98,
              matchEnded: true,
            });
            const bytes = toBinary(StreamSoloMatchTrackingResponseSchema, resp);
            const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            this.onmessage?.({ data: ab });
          }, 10);
        }
      }

      close() {
        this.readyState = 3; // CLOSED
        this.onclose?.();
      }
    }

    const originalWebSocket = global.WebSocket;
    // @ts-expect-error mock assignment
    global.WebSocket = MockWebSocket;

    const responses: any[] = [];
    const client = new WebTransportRefereeClient();

    try {
      await client.connect({
        exerciseId: "bicep_curl",
        matchId: "live-set-123",
        onError: (err) => console.error("TEST onError:", err),
        onResponse: (resp) => responses.push(resp),
      });

      expect(client.isConnected).toBe(true);
      expect(client.kind).toBe("websocket");

      // Wait for config response
      await new Promise((r) => setTimeout(r, 40));
      expect(responses.length).toBeGreaterThanOrEqual(1);
      expect(responses[0]?.repPhase).toBe("start");

      // Send neutral frame (wrists low at y=100)
      const neutralKeypoints = Array.from({ length: 17 }, (_, i) => ({
        x: 100,
        y: 100,
        score: 0.9,
      }));
      await client.sendFrame(neutralKeypoints);
      await new Promise((r) => setTimeout(r, 40));

      // Send flexed frame (wrists curled up at y=30)
      const flexedKeypoints = Array.from({ length: 17 }, (_, i) => ({
        x: 100,
        y: i === 9 || i === 10 ? 30 : 100,
        score: 0.9,
      }));
      await client.sendFrame(flexedKeypoints);
      await new Promise((r) => setTimeout(r, 40));

      const latestResp = responses[responses.length - 1];
      expect(latestResp?.myConfirmedValue).toBe(1);
      expect(latestResp?.currentAngle).toBe(45);
      expect(latestResp?.repPhase).toBe("bottom");
      expect(latestResp?.detectedErrors).toContain("elbow_sway");
      expect(latestResp?.audioCue).toBe("bicep_curl_elbow_sway_cue");

      // Submit set
      await client.submit();
      await new Promise((r) => setTimeout(r, 40));

      const finalResp = responses[responses.length - 1];
      expect(finalResp?.matchEnded).toBe(true);
    } finally {
      client.close();
      global.fetch = originalFetch;
      global.WebSocket = originalWebSocket;
    }
  });
});
