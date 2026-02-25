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

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn(
      (body: unknown, init: { status: number }) =>
        ({ body, status: init.status }) as any,
    ),
  },
}));

describe("handleApiError", () => {
  describe("ZodError handling", () => {
    it("returns 400 with first issue message for ZodError", () => {
      const zodError = new ZodError([
        {
          code: "too_small",
          minimum: 1,
          origin: "string",
          inclusive: true,
          message: "Le nom est requis",
          path: ["name"],
        },
      ]);

      const response = handleApiError(zodError) as any;
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("ValidationError");
      expect(response.body.message).toBe("Le nom est requis");
    });

    it("returns default message when ZodError has no issues", () => {
      const zodError = new ZodError([]);

      const response = handleApiError(zodError) as any;
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Une erreur de validation s'est produite",
      );
    });
  });

  describe("AppError handling", () => {
    it("returns correct status for BadRequestError", () => {
      const error = new BadRequestError("Données invalides");
      const response = handleApiError(error) as any;
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("BadRequestError");
      expect(response.body.message).toBe("Données invalides");
    });

    it("returns correct status for UnauthorizedError", () => {
      const error = new UnauthorizedError("Non connecté");
      const response = handleApiError(error) as any;
      expect(response.status).toBe(401);
      expect(response.body.type).toBe("UnauthorizedError");
    });

    it("returns correct status for ForbiddenError", () => {
      const error = new ForbiddenError("Accès non autorisé");
      const response = handleApiError(error) as any;
      expect(response.status).toBe(403);
      expect(response.body.type).toBe("ForbiddenError");
    });

    it("returns correct status for NotFoundError", () => {
      const error = new NotFoundError("Document introuvable");
      const response = handleApiError(error) as any;
      expect(response.status).toBe(404);
      expect(response.body.type).toBe("NotFoundError");
    });

    it("returns correct status for TooManyRequestsError", () => {
      const error = new TooManyRequestsError("Trop de requêtes");
      const response = handleApiError(error) as any;
      expect(response.status).toBe(429);
      expect(response.body.type).toBe("TooManyRequestsError");
    });

    it("preserves message from AppError", () => {
      const error = new AppError("Custom message", 418);
      const response = handleApiError(error) as any;
      expect(response.status).toBe(418);
      expect(response.body.message).toBe("Custom message");
    });
  });

  describe("Unknown error handling", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns 500 for unknown errors in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      const response = handleApiError(new Error("secret info")) as any;
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("ServerError");
      expect(response.body.message).toBe(
        "Une erreur inattendue s'est produite",
      );
    });

    it("returns error message in development for Error instances", () => {
      vi.stubEnv("NODE_ENV", "development");

      const response = handleApiError(new Error("debug info")) as any;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("debug info");
    });

    it("returns generic message for non-Error types", () => {
      const response = handleApiError("string error") as any;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(
        "Une erreur inattendue s'est produite",
      );
    });

    it("returns generic message for null", () => {
      const response = handleApiError(null) as any;
      expect(response.status).toBe(500);
    });
  });
});
