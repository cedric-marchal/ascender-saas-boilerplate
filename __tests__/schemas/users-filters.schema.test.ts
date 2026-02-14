import { FilterUsersSchema } from "@/features/users/schemas/users-filter.schema";
import { describe, expect, it } from "vitest";

describe("FilterUsersSchema", () => {
  const validData = {
    search: "jean",
    role: "all" as const,
    verified: "all" as const,
  };

  it("accepts valid data with all defaults", () => {
    const result = FilterUsersSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts empty search string", () => {
    const result = FilterUsersSchema.safeParse({ ...validData, search: "" });
    expect(result.success).toBe(true);
  });

  it("trims search string", () => {
    const result = FilterUsersSchema.safeParse({
      ...validData,
      search: "  jean  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("jean");
    }
  });

  it("rejects search exceeding max length (100 chars)", () => {
    const result = FilterUsersSchema.safeParse({
      ...validData,
      search: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts search at max boundary (100 chars)", () => {
    const result = FilterUsersSchema.safeParse({
      ...validData,
      search: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  describe("role", () => {
    it("accepts 'all'", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        role: "all",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'ADMIN'", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        role: "ADMIN",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'CUSTOMER'", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        role: "CUSTOMER",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid role", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        role: "MANAGER",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("verified", () => {
    it("accepts 'all'", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        verified: "all",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'verified'", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        verified: "verified",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'unverified'", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        verified: "unverified",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid verification status", () => {
      const result = FilterUsersSchema.safeParse({
        ...validData,
        verified: "pending",
      });
      expect(result.success).toBe(false);
    });
  });
});
