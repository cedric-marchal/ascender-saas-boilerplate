import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/utils/errors/errors";
import { handleActionError } from "@/utils/errors/handle-action-error";

describe("handleActionError", () => {
  describe("ZodError handling", () => {
    it("returns ValidationError with first issue message", () => {
      const zodError = new ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "Le nom est requis",
          path: ["name"],
        },
      ]);

      const result = handleActionError(zodError);
      expect(result.success).toBe(false);
      expect(result.type).toBe("ValidationError");
      expect(result.error).toBe("Le nom est requis");
    });

    it("returns default message when ZodError has no issues", () => {
      const zodError = new ZodError([]);

      const result = handleActionError(zodError);
      expect(result.error).toBe("Une erreur de validation s'est produite");
    });
  });

  describe("AppError handling", () => {
    it("returns correct type for BadRequestError", () => {
      const error = new BadRequestError("Données invalides");
      const result = handleActionError(error);
      expect(result.success).toBe(false);
      expect(result.type).toBe("BadRequestError");
      expect(result.error).toBe("Données invalides");
    });

    it("returns correct type for UnauthorizedError", () => {
      const error = new UnauthorizedError("Non connecté");
      const result = handleActionError(error);
      expect(result.type).toBe("UnauthorizedError");
      expect(result.error).toBe("Non connecté");
    });

    it("returns correct type for ForbiddenError", () => {
      const error = new ForbiddenError("Accès non autorisé");
      const result = handleActionError(error);
      expect(result.type).toBe("ForbiddenError");
    });

    it("returns correct type for NotFoundError", () => {
      const error = new NotFoundError("Document introuvable");
      const result = handleActionError(error);
      expect(result.type).toBe("NotFoundError");
    });

    it("returns correct type for TooManyRequestsError", () => {
      const error = new TooManyRequestsError("Trop de requêtes");
      const result = handleActionError(error);
      expect(result.type).toBe("TooManyRequestsError");
    });

    it("preserves message from custom AppError", () => {
      const error = new AppError("Custom error message", 418);
      const result = handleActionError(error);
      expect(result.error).toBe("Custom error message");
    });
  });

  describe("Unknown error handling", () => {
    it("returns ServerError type for Error instances in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const result = handleActionError(new Error("secret"));
      expect(result.success).toBe(false);
      expect(result.type).toBe("ServerError");
      expect(result.error).toBe("Une erreur inattendue s'est produite");

      process.env.NODE_ENV = originalEnv;
    });

    it("returns error message in development for Error instances", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const result = handleActionError(new Error("debug info"));
      expect(result.type).toBe("ServerError");
      expect(result.error).toBe("debug info");

      process.env.NODE_ENV = originalEnv;
    });

    it("returns UnknownError type for non-Error types", () => {
      const result = handleActionError("string error");
      expect(result.success).toBe(false);
      expect(result.type).toBe("UnknownError");
      expect(result.error).toBe("Une erreur inattendue s'est produite");
    });

    it("returns UnknownError type for null", () => {
      const result = handleActionError(null);
      expect(result.type).toBe("UnknownError");
    });

    it("returns UnknownError type for undefined", () => {
      const result = handleActionError(undefined);
      expect(result.type).toBe("UnknownError");
    });
  });
});
