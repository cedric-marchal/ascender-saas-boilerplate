import { render } from "react-email";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockSendEmailSafe = vi.fn();

vi.mock("@/lib/resend", () => ({
  sendEmailSafe: mockSendEmailSafe,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_NAME: "Next SaaS",
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
    RESEND_EMAIL_NOREPLY: "noreply@test.example.com",
  },
}));

// Import after mocks
const { sendInvitationEmail } =
  await import("@/features/organizations/services/send-invitation-email.service");

const baseInput = {
  invitationId: "inv-123",
  email: "invitee@example.com",
  inviterName: "Jane Doe",
  inviterEmail: "jane@example.com",
  organizationName: "Acme Corp",
  role: "admin",
};

describe("sendInvitationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds an English locale-prefixed accept link", async () => {
    await sendInvitationEmail({ ...baseInput, locale: "en" });

    expect(mockSendEmailSafe).toHaveBeenCalledTimes(1);

    const emailCall = mockSendEmailSafe.mock.calls[0]![0];
    const html = await render(emailCall.react);

    expect(html).toContain(
      "https://test.example.com/en/accept-invitation/inv-123",
    );
  });

  it("builds a French locale-prefixed accept link", async () => {
    await sendInvitationEmail({ ...baseInput, locale: "fr" });

    expect(mockSendEmailSafe).toHaveBeenCalledTimes(1);

    const emailCall = mockSendEmailSafe.mock.calls[0]![0];
    const html = await render(emailCall.react);

    expect(html).toContain(
      "https://test.example.com/fr/accepter-invitation/inv-123",
    );
  });

  it("sends the email to the invitee address", async () => {
    await sendInvitationEmail({ ...baseInput, locale: "en" });

    const emailCall = mockSendEmailSafe.mock.calls[0]![0];

    expect(emailCall.to).toBe("invitee@example.com");
  });
});
