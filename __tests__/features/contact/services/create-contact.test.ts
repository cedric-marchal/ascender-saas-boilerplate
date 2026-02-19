import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockSendEmail = vi.fn();

vi.mock("@/lib/resend", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_NAME: "TestApp",
    RESEND_EMAIL_NOREPLY: "noreply@test.com",
    RESEND_EMAIL_CONTACT: "contact@test.com",
  },
}));

// Import after mocks
const { createContact } = await import(
  "@/features/contact/services/create-contact.service"
);

describe("createContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("calls sendEmail with correct params", async () => {
    const input = {
      name: "John Doe",
      email: "john@example.com",
      subject: "Question about pricing",
      message: "I would like to know more about your pricing plans.",
    };

    await createContact(input);

    expect(mockSendEmail).toHaveBeenCalledWith({
      from: "TestApp <noreply@test.com>",
      to: "contact@test.com",
      replyTo: "john@example.com",
      subject: "[Contact] Question about pricing",
      react: expect.anything(),
    });
  });

  it("uses [Contact] prefix in subject", async () => {
    const input = {
      name: "Jane Smith",
      email: "jane@example.com",
      subject: "Bug report",
      message: "I found a bug in the application.",
    };

    await createContact(input);

    const call = mockSendEmail.mock.calls[0]?.[0];
    expect(call?.subject).toBe("[Contact] Bug report");
  });

  it("uses RESEND_EMAIL_CONTACT as recipient", async () => {
    const input = {
      name: "Test User",
      email: "test@example.com",
      subject: "Test subject",
      message: "Test message",
    };

    await createContact(input);

    const call = mockSendEmail.mock.calls[0]?.[0];
    expect(call?.to).toBe("contact@test.com");
  });

  it("uses input.email as replyTo", async () => {
    const input = {
      name: "Reply Test",
      email: "reply@example.com",
      subject: "Test",
      message: "Test",
    };

    await createContact(input);

    const call = mockSendEmail.mock.calls[0]?.[0];
    expect(call?.replyTo).toBe("reply@example.com");
  });

  it("passes ContactEmail with all input fields", async () => {
    const input = {
      name: "Full Test",
      email: "full@example.com",
      subject: "Complete test",
      message: "This is a complete test message with all fields.",
    };

    await createContact(input);

    const call = mockSendEmail.mock.calls[0]?.[0];
    expect(call?.react).toBeDefined();
  });

  it("propagates sendEmail errors", async () => {
    const input = {
      name: "Error Test",
      email: "error@example.com",
      subject: "Error",
      message: "Error",
    };

    mockSendEmail.mockRejectedValue(new Error("Email service unavailable"));

    await expect(createContact(input)).rejects.toThrow(
      "Email service unavailable"
    );
  });

  it("uses APP_NAME in from field", async () => {
    const input = {
      name: "App Name Test",
      email: "appname@example.com",
      subject: "Test",
      message: "Test",
    };

    await createContact(input);

    const call = mockSendEmail.mock.calls[0]?.[0];
    expect(call?.from).toBe("TestApp <noreply@test.com>");
  });
});
