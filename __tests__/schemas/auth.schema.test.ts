import { describe, expect, it } from "vitest";

import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
} from "@/features/auth/schemas/auth.schema";

describe("SignUpSchema", () => {
  const validData = {
    name: "Jean Dupont",
    email: "jean@exemple.fr",
    password: "SecurePass123",
  };

  it("accepts valid data", () => {
    const result = SignUpSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("trims and lowercases email", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      email: "  JEAN@EXEMPLE.FR  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jean@exemple.fr");
    }
  });

  it("trims name", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      name: "  Jean Dupont  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jean Dupont");
    }
  });

  it("rejects empty name", () => {
    const result = SignUpSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = SignUpSchema.safeParse({ ...validData, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      email: "not-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 12 characters", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      password: "Short1Aa",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase letter", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      password: "ALLUPPERCASE1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      password: "alllowercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      password: "NoDigitsHereAbc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password exceeding 128 characters", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      password: "Aa1" + "x".repeat(126),
    });
    expect(result.success).toBe(false);
  });
});

describe("SignInSchema", () => {
  const validData = {
    email: "jean@exemple.fr",
    password: "anypassword",
  };

  it("accepts valid data", () => {
    const result = SignInSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("lowercases and trims email", () => {
    const result = SignInSchema.safeParse({
      ...validData,
      email: "  JEAN@EXEMPLE.FR  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jean@exemple.fr");
    }
  });

  it("rejects empty email", () => {
    const result = SignInSchema.safeParse({ ...validData, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = SignInSchema.safeParse({ ...validData, password: "" });
    expect(result.success).toBe(false);
  });

  it("does not enforce password complexity (sign-in only)", () => {
    const result = SignInSchema.safeParse({
      ...validData,
      password: "simple",
    });
    expect(result.success).toBe(true);
  });
});

describe("ForgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = ForgotPasswordSchema.safeParse({
      email: "jean@exemple.fr",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = ForgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = ForgotPasswordSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("lowercases and trims email", () => {
    const result = ForgotPasswordSchema.safeParse({
      email: "  JEAN@EXEMPLE.FR  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jean@exemple.fr");
    }
  });
});

describe("ResetPasswordSchema", () => {
  const validData = {
    password: "NewSecure123A",
    confirmPassword: "NewSecure123A",
  };

  it("accepts matching passwords", () => {
    const result = ResetPasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects non-matching passwords", () => {
    const result = ResetPasswordSchema.safeParse({
      password: "NewSecure123A",
      confirmPassword: "DifferentPass1A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmErrors = result.error.issues.filter((issue) =>
        issue.path.includes("confirmPassword")
      );
      expect(confirmErrors.length).toBeGreaterThan(0);
    }
  });

  it("enforces password complexity on password field", () => {
    const result = ResetPasswordSchema.safeParse({
      password: "simple",
      confirmPassword: "simple",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty confirmation", () => {
    const result = ResetPasswordSchema.safeParse({
      password: "NewSecure123A",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });
});
