// Binary uvarint length-prefixed framing for WebTransport bidirectional streams

export interface KeypointInput {
  x: number;
  y: number;
  score: number;
}

export interface WtServerConfig {
  certHashBase64?: string;
  soloUrl?: string;
  soloFallbackPath?: string;
  token?: string;
  url?: string;
  fallbackPath?: string;
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
