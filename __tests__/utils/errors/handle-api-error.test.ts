import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

const mockCookiesGet = vi.fn();

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn(
      (body: unknown, init: { status: number }) =>
        ({ body, status: init.status }) as any,
    ),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: mockCookiesGet,
    }),
  ),
}));

describe("handleApiError", () => {
  afterEach(() => {
    mockCookiesGet.mockReset();
    vi.unstubAllEnvs();
  });

  describe("ZodError handling", () => {
    it("returns 400 with first issue message for ZodError", async () => {
      const zodError = new ZodError([
        {
          code: "too_small",
          minimum: 1,
          origin: "string",
          inclusive: true,
          message: "Name is required",
          path: ["name"],
        },
      ]);

      const response = (await handleApiError(zodError)) as any;
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("ValidationError");
      expect(response.body.message).toBe("Name is required");
    });

    it("returns default message when ZodError has no issues (default locale)", async () => {
      const zodError = new ZodError([]);

      const response = (await handleApiError(zodError)) as any;
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("A validation error occurred");
    });

    it("returns the French default message when NEXT_LOCALE cookie is fr", async () => {
      mockCookiesGet.mockReturnValue({ value: "fr" });

      const zodError = new ZodError([]);

      const response = (await handleApiError(zodError)) as any;
      expect(response.body.message).toBe(
        "Une erreur de validation s'est produite",
      );
    });
  });

  describe("AppError handling", () => {
    it("returns correct status for BadRequestError and passes through a literal message", async () => {
      const error = new BadRequestError("Invalid data");
      const response = (await handleApiError(error)) as any;
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("BadRequestError");
      expect(response.body.message).toBe("Invalid data");
    });

    it("returns correct status for UnauthorizedError", async () => {
      const error = new UnauthorizedError("Not signed in");
      const response = (await handleApiError(error)) as any;
      expect(response.status).toBe(401);
      expect(response.body.type).toBe("UnauthorizedError");
    });

    it("returns correct status for ForbiddenError", async () => {
      const error = new ForbiddenError("Access denied");
      const response = (await handleApiError(error)) as any;
      expect(response.status).toBe(403);
      expect(response.body.type).toBe("ForbiddenError");
    });

    it("returns correct status for NotFoundError", async () => {
      const error = new NotFoundError("Document not found");
      const response = (await handleApiError(error)) as any;
      expect(response.status).toBe(404);
      expect(response.body.type).toBe("NotFoundError");
    });

    it("returns correct status for TooManyRequestsError", async () => {
      const error = new TooManyRequestsError("Too many requests");
      const response = (await handleApiError(error)) as any;
      expect(response.status).toBe(429);
      expect(response.body.type).toBe("TooManyRequestsError");
    });

    it("preserves message from AppError", async () => {
      const error = new AppError("Custom message", 418);
      const response = (await handleApiError(error)) as any;
      expect(response.status).toBe(418);
      expect(response.body.message).toBe("Custom message");
    });

    it("translates an errors.* key using the resolved locale", async () => {
      mockCookiesGet.mockReturnValue({ value: "fr" });

      const error = new UnauthorizedError("errors.common.unauthenticated");
      const response = (await handleApiError(error)) as any;
      expect(response.body.message).toBe("Vous devez être connecté");
    });
  });

  describe("Unknown error handling", () => {
    it("returns 500 for unknown errors in production (default locale)", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const response = (await handleApiError(new Error("secret info"))) as any;
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("ServerError");
      expect(response.body.message).toBe("An unexpected error occurred");
    });

    it("returns error message in development for Error instances", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const response = (await handleApiError(new Error("debug info"))) as any;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("debug info");
    });

    it("returns generic message for non-Error types", async () => {
      const response = (await handleApiError("string error")) as any;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("An unexpected error occurred");
    });

    it("returns generic message for null", async () => {
      const response = (await handleApiError(null)) as any;
      expect(response.status).toBe(500);
    });
  });
});
