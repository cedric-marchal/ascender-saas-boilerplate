import { getErrorMessage } from "@/utils/errors/get-error-message";
import { describe, expect, it, vi } from "vitest";

// Mock up-fetch
vi.mock("up-fetch", () => ({
  isResponseError: vi.fn((error: unknown) => {
    return (
      typeof error === "object" &&
      error !== null &&
      "data" in error &&
      "status" in error
    );
  }),
}));

describe("getErrorMessage", () => {
  it("returns message from standard Error", () => {
    const error = new Error("Erreur de validation");
    const message = getErrorMessage(error);

    expect(message).toBe("Erreur de validation");
  });

  it("returns message from ResponseError with data.message", () => {
    const error = {
      status: 400,
      data: { message: "Email déjà utilisé" },
    };
    const message = getErrorMessage(error);

    expect(message).toBe("Email déjà utilisé");
  });

  it("returns default message for ResponseError without data.message", () => {
    const error = {
      status: 500,
      data: { error: "Internal Server Error" },
    };
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("returns default message for ResponseError with null data", () => {
    const error = {
      status: 404,
      data: null,
    };
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("returns default message for ResponseError with empty data", () => {
    const error = {
      status: 503,
      data: {},
    };
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("returns default message for string error", () => {
    const error = "Something went wrong";
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("returns default message for null error", () => {
    const error = null;
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("returns default message for number error", () => {
    const error = 500;
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("returns default message for object without message", () => {
    const error = { code: "ERR_UNKNOWN" };
    const message = getErrorMessage(error);

    expect(message).toBe("Une erreur est survenue");
  });

  it("handles Error subclasses", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error = new CustomError("Custom error occurred");
    const message = getErrorMessage(error);

    expect(message).toBe("Custom error occurred");
  });

  it("returns message from ResponseError with nested data structure", () => {
    const error = {
      status: 422,
      data: {
        message: "Validation échouée",
        errors: [{ field: "email", message: "Email invalide" }],
      },
    };
    const message = getErrorMessage(error);

    expect(message).toBe("Validation échouée");
  });
});
