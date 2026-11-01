import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";

import { WebTransportRefereeClient } from "@/features/workout/domain/webtransport-client";
import {
  StreamWorkoutTrackingRequestSchema,
  StreamWorkoutTrackingResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

describe("WebTransportRefereeClient End-to-End WebSocket Session", () => {
  it("completes full session: init handshake -> frame telemetry -> rep count -> submit", async () => {
    // Mock global fetch for wt-config
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL) => {
      if (input.toString().includes("/api/execution/wt-config")) {
        return new Response(
          JSON.stringify({
            fallback_path: "/api/v1/execution/wt-stream",
            token: "mock-jwt-token",
            url: "https://localhost:8443/api/v1/execution/wt",
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 },
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
        const req = fromBinary(StreamWorkoutTrackingRequestSchema, raw);

        if (req.payload.case === "init") {
          setTimeout(() => {
            const resp = create(StreamWorkoutTrackingResponseSchema, {
              currentAngle: 160,
              detectedErrors: [],
              formScore: 100,
              isValidForm: true,
              personDetected: true,
              repPhase: "start",
              repsCompleted: 0,
            });
            const bytes = toBinary(StreamWorkoutTrackingResponseSchema, resp);
            const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            this.onmessage?.({ data: ab });
          }, 10);
        } else if (req.payload.case === "frame") {
          const frame = req.payload.value;
          const wrist = frame.landmarks.find(
            (l) => l.landmarkIndex === 9 || l.landmarkIndex === 10,
          );
          const isFlexed = (wrist?.y ?? 100) < 50;

          if (isFlexed && this.repCount === 0) {
            this.repCount = 1;
          }

          setTimeout(() => {
            const resp = create(StreamWorkoutTrackingResponseSchema, {
              audioCue: isFlexed ? "bicep_curl_elbow_sway_cue" : "",
              currentAngle: isFlexed ? 45 : 150,
              detectedErrors: isFlexed ? ["elbow_sway"] : [],
              formScore: 98,
              isValidForm: !isFlexed,
              personDetected: true,
              repPhase: isFlexed ? "bottom" : "start",
              repsCompleted: this.repCount,
            });
            const bytes = toBinary(StreamWorkoutTrackingResponseSchema, resp);
            const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            this.onmessage?.({ data: ab });
          }, 10);
        } else if (req.payload.case === "submit") {
          setTimeout(() => {
            const resp = create(StreamWorkoutTrackingResponseSchema, {
              currentAngle: 160,
              formScore: 98,
              isSetCompleted: true,
              isValidForm: true,
              repPhase: "completed",
              repsCompleted: this.repCount,
            });
            const bytes = toBinary(StreamWorkoutTrackingResponseSchema, resp);
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
        onError: (err) => console.error("TEST onError:", err),
        onResponse: (resp) => responses.push(resp),
        sessionId: "live-set-123",
      });

      expect(client.isConnected).toBe(true);
      expect(client.kind).toBe("websocket");

      // Wait for init response
      await new Promise((r) => setTimeout(r, 40));
      expect(responses.length).toBeGreaterThanOrEqual(1);
      expect(responses[0]?.repPhase).toBe("start");

      // Send neutral frame (wrists low at y=100)
      const neutralKeypoints = Array.from({ length: 17 }, () => ({
        score: 0.9,
        x: 100,
        y: 100,
      }));
      await client.sendFrame(neutralKeypoints);
      await new Promise((r) => setTimeout(r, 40));

      // Send flexed frame (wrists curled up at y=30)
      const flexedKeypoints = Array.from({ length: 17 }, (_, i) => ({
        score: 0.9,
        x: 100,
        y: i === 9 || i === 10 ? 30 : 100,
      }));
      await client.sendFrame(flexedKeypoints);
      await new Promise((r) => setTimeout(r, 40));

      const latestResp = responses[responses.length - 1];
      expect(latestResp?.repsCompleted).toBe(1);
      expect(latestResp?.currentAngle).toBe(45);
      expect(latestResp?.repPhase).toBe("bottom");
      expect(latestResp?.detectedErrors).toContain("elbow_sway");
      expect(latestResp?.audioCue).toBe("bicep_curl_elbow_sway_cue");

      // Submit set
      await client.submit();
      await new Promise((r) => setTimeout(r, 40));

      const finalResp = responses[responses.length - 1];
      expect(finalResp?.isSetCompleted).toBe(true);
    } finally {
      client.close();
      global.fetch = originalFetch;
      global.WebSocket = originalWebSocket;
    }
  });
});
