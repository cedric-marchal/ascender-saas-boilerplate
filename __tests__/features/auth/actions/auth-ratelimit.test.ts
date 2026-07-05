import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooManyRequestsError } from "@/utils/errors/errors";

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing actions
// ---------------------------------------------------------------------------

const mockCheckRatelimit = vi.fn();
const mockHeaders = vi.fn();
const mockSignInEmail = vi.fn();
const mockSignUpEmail = vi.fn();
const mockRequestPasswordReset = vi.fn();
const mockResetPassword = vi.fn();

vi.mock("@/utils/ratelimit/check-ratelimit", () => ({
  checkRatelimit: mockCheckRatelimit,
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn().mockResolvedValue("en"),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: mockSignInEmail,
      signUpEmail: mockSignUpEmail,
      requestPasswordReset: mockRequestPasswordReset,
      resetPassword: mockResetPassword,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/ratelimit", () => ({
  authSignInRatelimit: { limit: "auth-sign-in" },
  authSignUpRatelimit: { limit: "auth-sign-up" },
  authPasswordRatelimit: { limit: "auth-password" },
}));

vi.mock("@/lib/navigation", () => ({
  ROLE_DASHBOARD_URL: {
    ADMIN: "/admin",
    CUSTOMER: "/dashboard",
  },
}));

// Import actions AFTER mocks
const { signInAction } = await import("@/features/auth/actions/sign-in.action");
const { signUpAction } = await import("@/features/auth/actions/sign-up.action");
const { forgotPasswordAction } =
  await import("@/features/auth/actions/forgot-password.action");
const { resetPasswordAction } =
  await import("@/features/auth/actions/reset-password.action");

const THROTTLE_MESSAGE = "Trop de requêtes. Veuillez réessayer plus tard.";

describe("auth actions rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue({
      get: (name: string) => {
        if (name === "x-forwarded-for") {
          return "1.2.3.4";
        }
        return null;
      },
    });
  });

  describe("signInAction", () => {
    it("rejects the 6th rapid attempt with TooManyRequestsError", async () => {
      mockCheckRatelimit.mockRejectedValue(
        new TooManyRequestsError(THROTTLE_MESSAGE),
      );

      const result = await signInAction({
        email: "user@example.com",
        password: "password123",
      });

      expect(result?.serverError).toBe(THROTTLE_MESSAGE);
      expect(mockSignInEmail).not.toHaveBeenCalled();
    });

    it("calls checkRatelimit with IP+email identifier", async () => {
      mockCheckRatelimit.mockResolvedValue(undefined);
      mockSignInEmail.mockResolvedValue({
        user: { role: "CUSTOMER" },
      });

      await signInAction({
        email: "user@example.com",
        password: "password123",
      });

      expect(mockCheckRatelimit).toHaveBeenCalledWith(
        { limit: "auth-sign-in" },
        "1.2.3.4:user@example.com",
      );
    });

    it("allows the happy path when rate limit is not exceeded", async () => {
      mockCheckRatelimit.mockResolvedValue(undefined);
      mockSignInEmail.mockResolvedValue({
        user: { role: "CUSTOMER" },
      });

      const result = await signInAction({
        email: "user@example.com",
        password: "password123",
      });

      expect(result?.data?.success).toBe(true);
      expect(mockSignInEmail).toHaveBeenCalled();
    });
  });

  describe("signUpAction", () => {
    it("rejects when throttled", async () => {
      mockCheckRatelimit.mockRejectedValue(
        new TooManyRequestsError(THROTTLE_MESSAGE),
      );

      const result = await signUpAction({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Password1234",
      });

      expect(result?.serverError).toBe(THROTTLE_MESSAGE);
      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("allows the happy path when rate limit is not exceeded", async () => {
      mockCheckRatelimit.mockResolvedValue(undefined);
      mockSignUpEmail.mockResolvedValue(undefined);

      const result = await signUpAction({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Password1234",
      });

      expect(result?.data?.success).toBe(true);
      expect(mockSignUpEmail).toHaveBeenCalled();
    });
  });

  describe("forgotPasswordAction", () => {
    it("rejects when throttled", async () => {
      mockCheckRatelimit.mockRejectedValue(
        new TooManyRequestsError(THROTTLE_MESSAGE),
      );

      const result = await forgotPasswordAction({
        email: "jane@example.com",
      });

      expect(result?.serverError).toBe(THROTTLE_MESSAGE);
      expect(mockRequestPasswordReset).not.toHaveBeenCalled();
    });

    it("allows the happy path when rate limit is not exceeded", async () => {
      mockCheckRatelimit.mockResolvedValue(undefined);
      mockRequestPasswordReset.mockResolvedValue(undefined);

      const result = await forgotPasswordAction({
        email: "jane@example.com",
      });

      expect(result?.data?.success).toBe(true);
      expect(mockRequestPasswordReset).toHaveBeenCalled();
    });
  });

  describe("resetPasswordAction", () => {
    it("rejects when throttled", async () => {
      mockCheckRatelimit.mockRejectedValue(
        new TooManyRequestsError(THROTTLE_MESSAGE),
      );

      const result = await resetPasswordAction({
        password: "newPassword123!",
        confirmPassword: "newPassword123!",
        token: "reset-token",
      });

      expect(result?.serverError).toBe(THROTTLE_MESSAGE);
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it("allows the happy path when rate limit is not exceeded", async () => {
      mockCheckRatelimit.mockResolvedValue(undefined);
      mockResetPassword.mockResolvedValue(undefined);

      const result = await resetPasswordAction({
        password: "newPassword123!",
        confirmPassword: "newPassword123!",
        token: "reset-token",
      });

      expect(result?.data?.success).toBe(true);
      expect(mockResetPassword).toHaveBeenCalled();
    });
  });
});
