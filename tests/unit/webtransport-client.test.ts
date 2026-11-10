import { describe, expect, it } from "vitest";

import {
  encodeUvarintPrefixed,
  UvarintFrameDecoder,
} from "@/features/solo-match/domain/uvarint-framing";

describe("Uvarint Framing Protocol", () => {
  it("encodes and decodes single-byte length prefixes correctly", () => {
    const payload = new Uint8Array([10, 20, 30, 40, 50]);
    const framed = encodeUvarintPrefixed(payload);

    expect(framed[0]).toBe(5); // length 5
    expect(framed.slice(1)).toEqual(payload);

    const decoder = new UvarintFrameDecoder();
    decoder.append(framed);
    const decoded = decoder.nextMessage();

    expect(decoded).toEqual(payload);
    expect(decoder.nextMessage()).toBeNull();
  });

  it("handles multi-byte uvarint lengths (> 127 bytes)", () => {
    const payload = new Uint8Array(300);
    payload.fill(42);

    const framed = encodeUvarintPrefixed(payload);
    const decoder = new UvarintFrameDecoder();
    decoder.append(framed);

    const decoded = decoder.nextMessage();
    expect(decoded).toHaveLength(300);
    expect(decoded?.[0]).toBe(42);
    expect(decoded?.[299]).toBe(42);
  });

  it("buffers partial chunk arrivals over stream transport", () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const framed = encodeUvarintPrefixed(payload);

    const decoder = new UvarintFrameDecoder();
    // Feed half the message
    decoder.append(framed.slice(0, 4));
    expect(decoder.nextMessage()).toBeNull();

    // Feed remaining bytes
    decoder.append(framed.slice(4));
    const decoded = decoder.nextMessage();
    expect(decoded).toEqual(payload);
  });

  it("decodes multiple framed messages in a single continuous stream buffer", () => {
    const msg1 = new Uint8Array([10, 20]);
    const msg2 = new Uint8Array([30, 40, 50]);

    const framed1 = encodeUvarintPrefixed(msg1);
    const framed2 = encodeUvarintPrefixed(msg2);

    const combined = new Uint8Array(framed1.length + framed2.length);
    combined.set(framed1, 0);
    combined.set(framed2, framed1.length);

    const decoder = new UvarintFrameDecoder();
    decoder.append(combined);

    expect(decoder.nextMessage()).toEqual(msg1);
    expect(decoder.nextMessage()).toEqual(msg2);
    expect(decoder.nextMessage()).toBeNull();
  });
});
