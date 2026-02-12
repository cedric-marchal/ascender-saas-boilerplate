import { describe, expect, it } from "vitest";

import { passwordSchema, UpdatePasswordSchema } from "@/lib/schemas/password.schema";

describe("passwordSchema", () => {
  it("accepts valid password with lowercase, uppercase, and digit", () => {
    const result = passwordSchema.safeParse("SecurePass123");
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 12 characters", () => {
    const result = passwordSchema.safeParse("Short1Aa");
    expect(result.success).toBe(false);
  });

  it("accepts password at min boundary (12 chars)", () => {
    const result = passwordSchema.safeParse("Abcdefghij1a");
    expect(result.success).toBe(true);
  });

  it("rejects password exceeding 128 characters", () => {
    const result = passwordSchema.safeParse("Aa1" + "x".repeat(126));
    expect(result.success).toBe(false);
  });

  it("accepts password at max boundary (128 chars)", () => {
    const result = passwordSchema.safeParse("Aa1" + "x".repeat(125));
    expect(result.success).toBe(true);
  });

  it("rejects password without lowercase letter", () => {
    const result = passwordSchema.safeParse("ALLUPPERCASE1234");
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = passwordSchema.safeParse("alllowercase1234");
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = passwordSchema.safeParse("NoDigitsHereAbcd");
    expect(result.success).toBe(false);
  });

  it("trims password", () => {
    const result = passwordSchema.safeParse("  SecurePass123  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("SecurePass123");
    }
  });
});

describe("UpdatePasswordSchema", () => {
  const validData = {
    currentPassword: "OldPassword123",
    newPassword: "NewSecure123A",
    confirmPassword: "NewSecure123A",
  };

  it("accepts valid data", () => {
    const result = UpdatePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects when confirmPassword does not match newPassword", () => {
    const result = UpdatePasswordSchema.safeParse({
      ...validData,
      confirmPassword: "DifferentPass1A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmErrors = result.error.issues.filter(
        (issue) => issue.path.includes("confirmPassword")
      );
      expect(confirmErrors.length).toBeGreaterThan(0);
    }
  });

  it("rejects when newPassword equals currentPassword", () => {
    const result = UpdatePasswordSchema.safeParse({
      currentPassword: "SamePassword123",
      newPassword: "SamePassword123",
      confirmPassword: "SamePassword123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const newPasswordErrors = result.error.issues.filter(
        (issue) => issue.path.includes("newPassword")
      );
      expect(newPasswordErrors.length).toBeGreaterThan(0);
    }
  });

  it("rejects empty currentPassword", () => {
    const result = UpdatePasswordSchema.safeParse({
      ...validData,
      currentPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty confirmPassword", () => {
    const result = UpdatePasswordSchema.safeParse({
      ...validData,
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("enforces password complexity on newPassword", () => {
    const result = UpdatePasswordSchema.safeParse({
      ...validData,
      newPassword: "simplepassword",
      confirmPassword: "simplepassword",
    });
    expect(result.success).toBe(false);
  });

  it("trims all fields", () => {
    const result = UpdatePasswordSchema.safeParse({
      currentPassword: "  OldPassword123  ",
      newPassword: "  NewSecure123A  ",
      confirmPassword: "  NewSecure123A  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentPassword).toBe("OldPassword123");
      expect(result.data.newPassword).toBe("NewSecure123A");
      expect(result.data.confirmPassword).toBe("NewSecure123A");
    }
  });
});
