import { describe, expect, it } from 'vitest';
import { describe, expect, it } from '@jest/globals';
import { Code, ConnectError } from "@connectrpc/connect";

import { toAppError } from "@/shared/api/errors/app-error";

describe(toAppError, () => {
  it("maps unauthenticated errors to a non-retryable session action", () => {
    const result = toAppError(new ConnectError("expired", Code.Unauthenticated));

    expect(result.kind).toBe("auth");
    expect(result.retryable).toBe(false);
    expect(result.message).toContain("expired");
  });

  it("maps unavailable errors to a safe retryable error", () => {
    const result = toAppError(new ConnectError("upstream detail", Code.Unavailable));

    expect(result.kind).toBe("unavailable");
    expect(result.retryable).toBe(true);
    expect(result.message).not.toContain("upstream detail");
  });
});
