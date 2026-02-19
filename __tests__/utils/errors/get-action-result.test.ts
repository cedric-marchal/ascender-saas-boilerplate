import { getActionResult } from "@/utils/errors/get-action-result";
import { describe, expect, it } from "vitest";

describe("getActionResult", () => {
  it("returns data when result has data", () => {
    const result = { data: { id: "123", name: "Test User" } };
    const data = getActionResult(result);

    expect(data).toEqual({ id: "123", name: "Test User" });
  });

  it("throws when result is undefined", () => {
    const result = undefined;

    expect(() => getActionResult(result)).toThrow("Une erreur est survenue");
  });

  it("throws with serverError when present", () => {
    const result = { serverError: "Erreur serveur personnalisée" };

    expect(() => getActionResult(result)).toThrow(
      "Erreur serveur personnalisée"
    );
  });

  it("throws when data is absent", () => {
    const result = {};

    expect(() => getActionResult(result)).toThrow("Une erreur est survenue");
  });

  it("throws with default message when result is undefined", () => {
    const result = undefined;

    expect(() => getActionResult(result)).toThrow("Une erreur est survenue");
  });

  it("throws with serverError message even if data is present", () => {
    const result = {
      serverError: "Erreur de validation",
      data: { id: "123" },
    };

    expect(() => getActionResult(result)).toThrow("Erreur de validation");
  });

  it("returns data with correct type inference", () => {
    type UserData = { id: string; email: string };
    const result = { data: { id: "user-1", email: "user@example.com" } };

    const data: UserData = getActionResult<UserData>(result);

    expect(data.id).toBe("user-1");
    expect(data.email).toBe("user@example.com");
  });

  it("throws when data is undefined explicitly", () => {
    const result = { data: undefined };

    expect(() => getActionResult(result)).toThrow("Une erreur est survenue");
  });

  it("returns data when serverError is undefined", () => {
    const result = {
      serverError: undefined,
      data: { success: true },
    };

    const data = getActionResult(result);

    expect(data).toEqual({ success: true });
  });
});
