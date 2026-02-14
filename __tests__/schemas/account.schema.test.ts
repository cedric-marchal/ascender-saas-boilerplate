import { DeleteAccountSchema } from "@/features/account/schemas/account.schema";
import { describe, expect, it } from "vitest";

describe("DeleteAccountSchema", () => {
  it("accepts valid email as confirmation", () => {
    const result = DeleteAccountSchema.safeParse({
      confirmation: "jean@exemple.fr",
    });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases confirmation", () => {
    const result = DeleteAccountSchema.safeParse({
      confirmation: "  JEAN@EXEMPLE.FR  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confirmation).toBe("jean@exemple.fr");
    }
  });

  it("rejects empty confirmation", () => {
    const result = DeleteAccountSchema.safeParse({ confirmation: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = DeleteAccountSchema.safeParse({
      confirmation: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects confirmation exceeding 254 characters", () => {
    const longEmail = "a".repeat(250) + "@ex.fr";
    const result = DeleteAccountSchema.safeParse({
      confirmation: longEmail,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = DeleteAccountSchema.safeParse({ confirmation: 123 });
    expect(result.success).toBe(false);
  });
});
