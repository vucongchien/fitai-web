import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRegisterBrand = vi.fn();
const mockGetAuthenticatedSession = vi.fn();

vi.mock("@connectrpc/connect", async () => {
  const actual = await vi.importActual<typeof import("@connectrpc/connect")>("@connectrpc/connect");
  return {
    ...actual,
    createClient: () => ({
      registerBrand: mockRegisterBrand,
    }),
  };
});

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn(() => ({})),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: () => mockGetAuthenticatedSession(),
}));

import { registerBrandAction } from "@/features/partner/api/partner-brand-service";

describe("registerBrandAction", () => {
  const validInput = {
    brandName: "FitGear Vietnam",
    description: "Official distributor of gym equipment and fitness accessories.",
    contactPhone: "0901234567",
    address: "123 Nguyen Hue, District 1, HCMC",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FITAI_RPC_URL = "http://localhost:8080";
  });

  it("returns validation error when brandName is too short", async () => {
    const result = await registerBrandAction({ ...validInput, brandName: "A" });
    expect(result.ok).toBe(false);
    expect(mockRegisterBrand).not.toHaveBeenCalled();
  });

  it("returns error when user is not authenticated", async () => {
    mockGetAuthenticatedSession.mockResolvedValue({ accessToken: undefined });
    const result = await registerBrandAction(validInput);
    expect(result).toEqual({
      ok: false,
      error: "Please sign in before submitting a Brand Partner application.",
    });
    expect(mockRegisterBrand).not.toHaveBeenCalled();
  });

  it("submits RegisterBrandRequest via ConnectRPC when valid and authenticated", async () => {
    mockGetAuthenticatedSession.mockResolvedValue({ accessToken: "token-123" });
    mockRegisterBrand.mockResolvedValue({
      success: true,
      message: "Application received.",
    });

    const result = await registerBrandAction(validInput);
    expect(result).toEqual({
      ok: true,
      message: "Application received.",
    });
    expect(mockRegisterBrand).toHaveBeenCalledWith(
      expect.objectContaining({
        brandName: validInput.brandName,
        description: validInput.description,
        contactPhone: validInput.contactPhone,
        address: validInput.address,
      }),
    );
  });

  it("returns error message when backend returns success=false", async () => {
    mockGetAuthenticatedSession.mockResolvedValue({ accessToken: "token-123" });
    mockRegisterBrand.mockResolvedValue({
      success: false,
      message: "An application has already been submitted for this account.",
    });

    const result = await registerBrandAction(validInput);
    expect(result).toEqual({
      ok: false,
      error: "An application has already been submitted for this account.",
    });
  });
});
