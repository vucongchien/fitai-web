// WebTransport client with WebSocket fallback for real-time referee streaming

import { create, fromBinary, toBinary } from "@bufbuild/protobuf";

import {
  SkeletonLandmarkSchema,
  SoloChallengeType,
  SoloTrackingAbortSchema,
  SoloTrackingConfigSchema,
  SoloTrackingFrameSchema,
  SoloTrackingSubmitSchema,
  StreamSoloMatchTrackingRequestSchema,
  StreamSoloMatchTrackingResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import type {
  StreamSoloMatchTrackingRequest,
  StreamSoloMatchTrackingResponse,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

export interface KeypointInput {
  x: number;
  y: number;
  score: number;
}

export interface WebTransportClientOptions {
  exerciseId: string;
  matchId?: string;
  planId?: string;
  cameraAngle?: string;
  challengeType?: SoloChallengeType;
  onResponse: (response: StreamSoloMatchTrackingResponse) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
}

export interface WtServerConfig {
  url: string;
  cert_hash_b64?: string;
  fallback_path?: string;
  token?: string;
}

export function encodeUvarintPrefixed(payload: Uint8Array): Uint8Array {
  const varintBytes: number[] = [];
  let n = payload.length;
  while (n >= 0x80) {
    varintBytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  varintBytes.push(n);

  const out = new Uint8Array(varintBytes.length + payload.length);
  out.set(varintBytes, 0);
  out.set(payload, varintBytes.length);
  return out;
}

export class UvarintFrameDecoder {
  private buffer = new Uint8Array(0);

  append(chunk: Uint8Array): void {
    const next = new Uint8Array(this.buffer.length + chunk.length);
    next.set(this.buffer, 0);
    next.set(chunk, this.buffer.length);
    this.buffer = next;
  }

  nextMessage(): Uint8Array | null {
    if (this.buffer.length === 0) {
      return null;
    }

    let len = 0;
    let shift = 0;
    let headerBytes = 0;

    for (let i = 0; i < this.buffer.length && i < 10; i++) {
      const b = this.buffer[i]!;
      headerBytes++;
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) {
        const totalNeeded = headerBytes + len;
        if (this.buffer.length < totalNeeded) {
          return null;
        }
        const msg = this.buffer.slice(headerBytes, totalNeeded);
        this.buffer = this.buffer.slice(totalNeeded);
        return msg;
      }
      shift += 7;
    }
    return null;
  }
}

export class WebTransportRefereeClient {
  private transportKind: "webtransport" | "websocket" | "disconnected" = "disconnected";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transport: any = null;
  private ws: WebSocket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wtWriter: any = null;
  private closed = false;
  private options: WebTransportClientOptions | null = null;

  get kind(): "webtransport" | "websocket" | "disconnected" {
    return this.transportKind;
  }

  get isConnected(): boolean {
    return this.transportKind !== "disconnected" && !this.closed;
  }

  async connect(options: WebTransportClientOptions): Promise<void> {
    this.options = options;
    this.closed = false;

    // Fetch config with cert fingerprint and endpoints
    let config: WtServerConfig;
    try {
      const res = await fetch("/api/execution/wt-config");
      if (!res.ok) {
        throw new Error(`wt-config failed with status ${res.status}`);
      }
      config = await res.json();
    } catch {
      // Direct local fallback if Next.js proxy route fails
      config = {
        cert_hash_b64: "",
        fallback_path: "/api/v1/execution/wt-stream",
        url: "https://localhost:8443/api/v1/execution/wt",
      };
    }

    // Try WebTransport if supported and cert hash is provided
    let connected = false;
    const isWebTransportAvailable = typeof window !== "undefined" && "WebTransport" in window;

    if (isWebTransportAvailable && config.cert_hash_b64) {
      try {
        await this.connectWebTransport(config, options);
        this.transportKind = "webtransport";
        connected = true;
        console.log("[RefereeClient] Connected via HTTP/3 WebTransport (QUIC)");
      } catch (wtErr) {
        console.warn("[RefereeClient] WebTransport connection failed, falling back to WebSocket:", wtErr);
      }
    }

    if (!connected) {
      await this.connectWebSocket(config, options);
      this.transportKind = "websocket";
      console.log("[RefereeClient] Connected via WebSocket fallback (TCP)");
    }

    // Send initial config message
    await this.sendConfig();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async connectWebTransport(config: WtServerConfig, options: WebTransportClientOptions): Promise<void> {
    const certHashBytes = Uint8Array.from(atob(config.cert_hash_b64 || ""), (c) => c.charCodeAt(0));
    const wtUrl = new URL(config.url);
    if (config.token) {
      wtUrl.searchParams.set("token", config.token);
    } else {
      wtUrl.searchParams.set("token", "dev-client");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WT = (window as any).WebTransport;
    const transport = new WT(wtUrl.toString(), {
      serverCertificateHashes: [{ algorithm: "sha-256", value: certHashBytes.buffer }],
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("WebTransport handshake timeout")), 3000),
    );
    await Promise.race([transport.ready, timeout]);

    const bidiStream = await transport.createBidirectionalStream();
    this.transport = transport;
    this.wtWriter = bidiStream.writable.getWriter();

    const reader = bidiStream.readable.getReader();
    const decoder = new UvarintFrameDecoder();

    (async () => {
      try {
        while (!this.closed) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            decoder.append(value);
            let msgBytes = decoder.nextMessage();
            while (msgBytes) {
              const resp = fromBinary(StreamSoloMatchTrackingResponseSchema, msgBytes);
              options.onResponse(resp);
              msgBytes = decoder.nextMessage();
            }
          }
        }
      } catch (err) {
        if (!this.closed) {
          options.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!this.closed) {
          options.onClose?.();
        }
      }
    })();
  }

  private async connectWebSocket(config: WtServerConfig, options: WebTransportClientOptions): Promise<void> {
    const loc = window.location;
    const host = loc.hostname || "localhost";
    const port = "8080";
    const wsProto = loc.protocol === "https:" ? "wss:" : "ws:";
    const fallbackPath = config.fallback_path || "/api/v1/execution/wt-stream";
    const wsUrl = new URL(`${wsProto}//${host}:${port}${fallbackPath}`);
    if (config.token) {
      wsUrl.searchParams.set("token", config.token);
    } else {
      wsUrl.searchParams.set("token", "dev-client");
    }

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl.toString());
      ws.binaryType = "arraybuffer";

      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }, 4000);

      ws.onopen = () => {
        clearTimeout(timer);
        if (this.closed) {
          ws.close();
          resolve();
          return;
        }
        this.ws = ws;
        resolve();
      };

      ws.onerror = (evt) => {
        clearTimeout(timer);
        reject(new Error(`WebSocket connection error: ${JSON.stringify(evt)}`));
      };

      ws.onmessage = (evt) => {
        try {
          const buf = new Uint8Array(evt.data as ArrayBuffer);
          const resp = fromBinary(StreamSoloMatchTrackingResponseSchema, buf);
          options.onResponse(resp);
        } catch (err) {
          options.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      };

      ws.onclose = () => {
        if (!this.closed) {
          options.onClose?.();
        }
      };
    });
  }

  private async sendConfig(): Promise<void> {
    if (!this.options) {
      return;
    }
    const matchId = this.options.matchId || `set-${Date.now()}`;
    const defaultChallengeType =
      this.options.exerciseId === "plank" ? SoloChallengeType.DURATION : SoloChallengeType.REPS;
    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "config",
        value: create(SoloTrackingConfigSchema, {
          cameraAngle: this.options.cameraAngle || "auto",
          challengeType: this.options.challengeType ?? defaultChallengeType,
          exerciseId: this.options.exerciseId,
          matchId: matchId,
          planId: this.options.planId || `plan-${this.options.exerciseId}`,
          timeCeilingSeconds: 600,
        }),
      },
    });
    await this.sendRequest(req);
  }

  async sendFrame(landmarks: KeypointInput[], timestampMs?: number, cameraAngle?: string): Promise<void> {
    if (this.closed) {
      return;
    }
    const now = timestampMs ?? Date.now();
    const seconds = BigInt(Math.floor(now / 1000));
    const nanos = (now % 1000) * 1_000_000;

    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "frame",
        value: create(SoloTrackingFrameSchema, {
          cameraAngle: cameraAngle || this.options?.cameraAngle || "auto",
          landmarks: landmarks.map((k, idx) =>
            create(SkeletonLandmarkSchema, {
              landmarkIndex: idx,
              presence: k.score,
              visibility: k.score,
              x: k.x,
              y: k.y,
              z: 0,
            }),
          ),
          timestamp: {
            nanos,
            seconds,
          },
        }),
      },
    });
    await this.sendRequest(req);
  }

  async submit(): Promise<void> {
    if (this.closed) {
      return;
    }
    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "submit",
        value: create(SoloTrackingSubmitSchema, {}),
      },
    });
    await this.sendRequest(req);
  }

  async abort(reason = "USER_ABORTED"): Promise<void> {
    if (this.closed) {
      return;
    }
    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "abort",
        value: create(SoloTrackingAbortSchema, { reason }),
      },
    });
    await this.sendRequest(req);
  }

  // Abort referee session with timeout and close stream
  async abortAndClose(reason: string, timeoutMs = 500): Promise<void> {
    try {
      await Promise.race([
        this.abort(reason),
        new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // Best-effort: the server's disconnect grace period is the backstop.
    } finally {
      this.close();
    }
  }

  private async sendRequest(req: StreamSoloMatchTrackingRequest): Promise<void> {
    const bytes = toBinary(StreamSoloMatchTrackingRequestSchema, req);
    if (this.transportKind === "webtransport" && this.wtWriter) {
      const framed = encodeUvarintPrefixed(bytes);
      await this.wtWriter.write(framed);
    } else if (this.transportKind === "websocket" && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(bytes);
    }
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      this.wtWriter?.close?.();
    } catch {
      // ignore
    }
    try {
      this.transport?.close?.();
    } catch {
      // ignore
    }
    try {
      this.ws?.close?.();
    } catch {
      // ignore
    }
    this.wtWriter = null;
    this.transport = null;
    this.ws = null;
    this.transportKind = "disconnected";
  }
}
