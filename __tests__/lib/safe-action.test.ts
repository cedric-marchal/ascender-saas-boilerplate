import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/utils/errors/errors";

const mockCaptureException = vi.fn();

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(() => Promise.resolve("en")),
}));

vi.mock("@/lib/observability", () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// `lib/safe-action.ts` also imports `@/lib/auth` (for authActionClient) and
// `@/lib/prisma` (for orgActionClient) — neither is exercised by the
// `actionClient` under test here, but the module graph still loads them, so
// they must be stubbed to avoid pulling in the real Prisma client / Better
// Auth config (which require live env vars and a DB connection).
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findFirst: vi.fn(),
    },
  },
}));

// Import after mocks
const { actionClient } = await import("@/lib/safe-action");

const throwingAction = actionClient.action(async () => {
  throw new Error("__ERROR_TO_THROW__");
});

describe("actionClient.handleServerError", () => {
  afterEach(() => {
    mockCaptureException.mockReset();
  });

  it("does NOT call captureException for an AppError (expected business error)", async () => {
    const businessErrorAction = actionClient.action(async () => {
      throw new AppError("Business error message", 400);
    });

    const result = await businessErrorAction();

    expect(result?.serverError).toBe("Business error message");
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("calls captureException for an unexpected error", async () => {
    const result = await throwingAction();

    expect(result?.serverError).toBeDefined();
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "__ERROR_TO_THROW__" }),
    );
  });
});
