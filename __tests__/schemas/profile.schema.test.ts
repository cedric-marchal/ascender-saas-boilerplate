import { UpdateProfileSchema } from "@/features/account/schemas/profile.schema";
import { describe, expect, it } from "vitest";

describe("UpdateProfileSchema", () => {
  const validData = {
    name: "Jean Dupont",
    email: "jean@exemple.fr",
  };

  it("accepts valid data", () => {
    const result = UpdateProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("trims name and email", () => {
    const result = UpdateProfileSchema.safeParse({
      name: "  Jean Dupont  ",
      email: "  jean@exemple.fr  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jean Dupont");
      expect(result.data.email).toBe("jean@exemple.fr");
    }
  });

  it("lowercases email", () => {
    const result = UpdateProfileSchema.safeParse({
      ...validData,
      email: "JEAN@EXEMPLE.FR",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jean@exemple.fr");
    }
  });

  describe("name", () => {
    it("rejects empty name", () => {
      const result = UpdateProfileSchema.safeParse({ ...validData, name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 100 characters", () => {
      const result = UpdateProfileSchema.safeParse({
        ...validData,
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts name at max boundary (100 chars)", () => {
      const result = UpdateProfileSchema.safeParse({
        ...validData,
        name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email", () => {
    it("rejects empty email", () => {
      const result = UpdateProfileSchema.safeParse({
        ...validData,
        email: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = UpdateProfileSchema.safeParse({
        ...validData,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email exceeding 255 characters", () => {
      const longEmail = "a".repeat(252) + "@ex.fr";
      const result = UpdateProfileSchema.safeParse({
        ...validData,
        email: longEmail,
      });
      expect(result.success).toBe(false);
    });
  });

  it("rejects non-string types", () => {
    const result = UpdateProfileSchema.safeParse({
      name: 123,
      email: true,
    });
    expect(result.success).toBe(false);
  });
});
