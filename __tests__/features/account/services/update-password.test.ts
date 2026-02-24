import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockChangePassword = vi.fn();
const mockSendEmail = vi.fn();
const mockHeaders = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      changePassword: mockChangePassword,
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_NAME: "TestApp",
    RESEND_EMAIL_SECURITY: "security@test.com",
  },
}));

// Import after mocks
const { updatePassword } =
  await import("@/features/account/services/update-password.service");

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockChangePassword.mockResolvedValue(undefined);
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("calls auth.api.changePassword with correct params", async () => {
    const input = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword456",
      userName: "John Doe",
      userEmail: "john@example.com",
    };

    await updatePassword(input);

    expect(mockChangePassword).toHaveBeenCalledWith({
      body: {
        newPassword: "newPassword456",
        currentPassword: "oldPassword123",
        revokeOtherSessions: false,
      },
      headers: expect.any(Headers),
    });
  });

  it("sends confirmation email with PasswordChangedEmail", async () => {
    const input = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword456",
      userName: "Jane Doe",
      userEmail: "jane@example.com",
    };

    await updatePassword(input);

    expect(mockSendEmail).toHaveBeenCalledWith({
      from: "TestApp Sécurité <security@test.com>",
      to: "jane@example.com",
      subject: "Votre mot de passe TestApp a été modifié",
      react: expect.anything(),
    });
  });

  it("propagates auth.api.changePassword errors", async () => {
    const input = {
      currentPassword: "wrongPassword",
      newPassword: "newPassword456",
      userName: "John Doe",
      userEmail: "john@example.com",
    };

    mockChangePassword.mockRejectedValue(new Error("Invalid password"));

    await expect(updatePassword(input)).rejects.toThrow("Invalid password");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("propagates sendEmail errors", async () => {
    const input = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword456",
      userName: "John Doe",
      userEmail: "john@example.com",
    };

    mockSendEmail.mockRejectedValue(new Error("Email service error"));

    await expect(updatePassword(input)).rejects.toThrow("Email service error");
  });

  it("uses headers from next/headers", async () => {
    const mockHeadersInstance = new Headers({
      "x-test": "value",
    });
    mockHeaders.mockResolvedValue(mockHeadersInstance);

    const input = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword456",
      userName: "John Doe",
      userEmail: "john@example.com",
    };

    await updatePassword(input);

    expect(mockHeaders).toHaveBeenCalled();
    expect(mockChangePassword).toHaveBeenCalledWith({
      body: expect.anything(),
      headers: mockHeadersInstance,
    });
  });
});
