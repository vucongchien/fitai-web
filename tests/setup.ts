/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: any) => fn),
}));
