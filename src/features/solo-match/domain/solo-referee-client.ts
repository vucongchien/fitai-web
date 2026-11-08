// Solo Match (1v1) real-time referee client over WebTransport (HTTP/3) with WebSocket fallback

import { create, fromBinary, toBinary } from "@bufbuild/protobuf";

import {
  UvarintFrameDecoder,
  encodeUvarintPrefixed,
} from "@/features/workout/domain/webtransport-client";
import type { KeypointInput, WtServerConfig } from "@/features/workout/domain/webtransport-client";
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

export interface SoloRefereeClientOptions {
  cameraAngle?: string;
  challengeType?: SoloChallengeType;
  exerciseId: string;
  matchId: string;
  onClose?: () => void;
  onError?: (err: Error) => void;
  onReconnecting?: (attempt: number) => void;
  onResponse: (response: StreamSoloMatchTrackingResponse) => void;
  planId?: string;
  /** Override backoff schedule in tests; defaults to exponential backoff within 45s grace window. */
  reconnectDelaysMs?: number[];
  timeCeilingSeconds?: number;
}

const DEFAULT_SOLO_RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 8000, 8000, 8000];

export class SoloRefereeClient {
  private transportKind: "webtransport" | "websocket" | "disconnected" = "disconnected";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transport: any = null;
  private ws: WebSocket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wtWriter: any = null;
  private closed = false;
  private matchEnded = false;
  private options: SoloRefereeClientOptions | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  get kind(): "webtransport" | "websocket" | "disconnected" {
    return this.transportKind;
  }

  get isConnected(): boolean {
    return this.transportKind !== "disconnected" && !this.closed;
  }

  async connect(options: SoloRefereeClientOptions): Promise<void> {
    this.options = options;
    this.closed = false;
    this.matchEnded = false;
    this.reconnectAttempt = 0;
    this.clearReconnectTimer();

    await this.openTransportAndInit(options);
  }

  private async fetchConfig(): Promise<WtServerConfig> {
    try {
      const res = await fetch("/api/execution/wt-config", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`wt-config failed with status ${res.status}`);
      }
      const raw = (await res.json()) as Record<string, unknown>;
      return {
        certHashBase64:
          typeof raw.certHashBase64 === "string"
            ? raw.certHashBase64
            : typeof raw.cert_hash_b64 === "string"
              ? raw.cert_hash_b64
              : "",
        fallbackPath:
          typeof raw.fallbackPath === "string" ? raw.fallbackPath : "/api/v1/execution/wt-stream",
        soloFallbackPath:
          typeof raw.soloFallbackPath === "string"
            ? raw.soloFallbackPath
            : typeof raw.solo_fallback_path === "string"
              ? raw.solo_fallback_path
              : "/api/v1/execution/solo-stream",
        soloUrl:
          typeof raw.soloUrl === "string"
            ? raw.soloUrl
            : typeof raw.solo_url === "string"
              ? raw.solo_url
              : "https://localhost:8443/api/v1/execution/solo-wt",
        token: typeof raw.token === "string" ? raw.token : undefined,
        url: typeof raw.url === "string" ? raw.url : "https://localhost:8443/api/v1/execution/wt",
      };
    } catch {
      return {
        certHashBase64: "",
        fallbackPath: "/api/v1/execution/wt-stream",
        soloFallbackPath: "/api/v1/execution/solo-stream",
        soloUrl: "https://localhost:8443/api/v1/execution/solo-wt",
        url: "https://localhost:8443/api/v1/execution/wt",
      };
    }
  }

  private async openTransportAndInit(options: SoloRefereeClientOptions): Promise<void> {
    if (this.closed || this.matchEnded) {
      return;
    }

    const config = await this.fetchConfig();
    if (this.closed || this.matchEnded) {
      return;
    }

    let connected = false;
    const isWebTransportAvailable = typeof window !== "undefined" && "WebTransport" in window;

    if (isWebTransportAvailable && config.certHashBase64) {
      try {
        await this.connectWebTransport(config, options);
        this.transportKind = "webtransport";
        connected = true;
      } catch {
        // Fall back to WebSocket
      }
    }

    if (!connected) {
      await this.connectWebSocket(config, options);
      this.transportKind = "websocket";
    }

    await this.sendConfig();
  }

  private async connectWebTransport(
    config: WtServerConfig,
    options: SoloRefereeClientOptions,
  ): Promise<void> {
    const certHashStr = config.certHashBase64 || "";
    const certHashBytes = Uint8Array.from(atob(certHashStr), (c) => c.charCodeAt(0));
    const targetUrl = config.soloUrl || "https://localhost:8443/api/v1/execution/solo-wt";
    const wtUrl = new URL(targetUrl);
    if (config.token) {
      wtUrl.searchParams.set("token", config.token);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WT = (window as any).WebTransport;
    const transport = new WT(wtUrl.toString(), {
      serverCertificateHashes: [{ algorithm: "sha-256", value: certHashBytes.buffer }],
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Solo WebTransport handshake timeout")), 3000),
    );
    await Promise.race([transport.ready, timeout]);

    const bidiStream = await transport.createBidirectionalStream();
    this.transport = transport;
    this.wtWriter = bidiStream.writable.getWriter();

    const reader = bidiStream.readable.getReader();
    const decoder = new UvarintFrameDecoder();

    void (async () => {
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
              this.handleIncomingResponse(resp, options);
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
          this.handleUnexpectedDisconnect();
        }
      }
    })();
  }

  private async connectWebSocket(
    config: WtServerConfig,
    options: SoloRefereeClientOptions,
  ): Promise<void> {
    const loc = typeof window !== "undefined" ? window.location : undefined;
    const wsProto = loc?.protocol === "https:" ? "wss:" : "ws:";
    const fallbackPath = config.soloFallbackPath || "/api/v1/execution/solo-stream";

    let targetAuthority = loc?.host || "localhost:8080";
    const baseTarget = config.soloUrl || config.url;
    if (baseTarget) {
      try {
        const parsed = new URL(baseTarget);
        if (parsed.hostname && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
          targetAuthority = parsed.host;
        } else if (loc?.hostname === "localhost" || loc?.hostname === "127.0.0.1") {
          targetAuthority = `${loc.hostname}:8080`;
        }
      } catch {
        // keep loc.host
      }
    }

    const wsUrl = new URL(`${wsProto}//${targetAuthority}${fallbackPath}`);
    if (config.token) {
      wsUrl.searchParams.set("token", config.token);
    }

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl.toString());
      ws.binaryType = "arraybuffer";

      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("Solo WebSocket connection timeout"));
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
        reject(new Error(`Solo WebSocket connection error: ${JSON.stringify(evt)}`));
      };

      ws.onmessage = (evt) => {
        try {
          const buf = new Uint8Array(evt.data as ArrayBuffer);
          const resp = fromBinary(StreamSoloMatchTrackingResponseSchema, buf);
          this.handleIncomingResponse(resp, options);
        } catch (err) {
          options.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      };

      ws.onclose = () => {
        if (!this.closed) {
          this.handleUnexpectedDisconnect();
        }
      };
    });
  }

  private handleIncomingResponse(
    resp: StreamSoloMatchTrackingResponse,
    options: SoloRefereeClientOptions,
  ): void {
    this.reconnectAttempt = 0;
    if (resp.matchEnded) {
      this.matchEnded = true;
      this.clearReconnectTimer();
    }
    options.onResponse(resp);
  }

  private handleUnexpectedDisconnect(): void {
    this.cleanupActiveTransportOnly();
    const options = this.options;
    if (!options || this.closed || this.matchEnded) {
      options?.onClose?.();
      return;
    }

    const delays = options.reconnectDelaysMs ?? DEFAULT_SOLO_RECONNECT_DELAYS_MS;
    const delay = delays[this.reconnectAttempt];
    if (delay === undefined) {
      options.onClose?.();
      return;
    }

    this.reconnectAttempt += 1;
    options.onReconnecting?.(this.reconnectAttempt);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.closed || this.matchEnded || !this.options) {
        return;
      }
      this.openTransportAndInit(this.options).catch((err) => {
        this.options?.onError?.(err instanceof Error ? err : new Error(String(err)));
        this.handleUnexpectedDisconnect();
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async sendConfig(): Promise<void> {
    if (!this.options || this.closed) {
      return;
    }
    const defaultChallengeType =
      this.options.exerciseId === "plank" ? SoloChallengeType.DURATION : SoloChallengeType.REPS;

    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "config",
        value: create(SoloTrackingConfigSchema, {
          cameraAngle: this.options.cameraAngle || "side",
          challengeType: this.options.challengeType ?? defaultChallengeType,
          exerciseId: this.options.exerciseId,
          matchId: this.options.matchId,
          planId: this.options.planId || "",
          timeCeilingSeconds: this.options.timeCeilingSeconds ?? 300,
        }),
      },
    });
    await this.sendRequest(req);
  }

  async sendFrame(
    landmarks: KeypointInput[],
    timestampMs?: number,
    cameraAngle?: string,
  ): Promise<void> {
    if (this.closed || this.matchEnded) {
      return;
    }
    const now = timestampMs ?? Date.now();
    const seconds = BigInt(Math.floor(now / 1000));
    const nanos = (now % 1000) * 1_000_000;

    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "frame",
        value: create(SoloTrackingFrameSchema, {
          cameraAngle: cameraAngle || this.options?.cameraAngle || "side",
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
    if (this.closed || this.matchEnded) {
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

  async abort(reason = "USER_FORFEITED"): Promise<void> {
    if (this.closed || this.matchEnded) {
      return;
    }
    const req = create(StreamSoloMatchTrackingRequestSchema, {
      payload: {
        case: "abort",
        value: create(SoloTrackingAbortSchema, {
          reason,
        }),
      },
    });
    await this.sendRequest(req);
  }

  private async sendRequest(req: StreamSoloMatchTrackingRequest): Promise<void> {
    const bytes = toBinary(StreamSoloMatchTrackingRequestSchema, req);
    if (this.transportKind === "webtransport" && this.wtWriter) {
      const framed = encodeUvarintPrefixed(bytes);
      await this.wtWriter.write(framed);
    } else if (
      this.transportKind === "websocket" &&
      this.ws &&
      this.ws.readyState === WebSocket.OPEN
    ) {
      this.ws.send(bytes);
    }
  }

  private cleanupActiveTransportOnly(): void {
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

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.clearReconnectTimer();
    this.cleanupActiveTransportOnly();
  }
}
