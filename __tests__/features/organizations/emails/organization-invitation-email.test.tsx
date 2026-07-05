import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { OrganizationInvitationEmail } from "@/features/organizations/emails/organization-invitation-email";

describe("OrganizationInvitationEmail", () => {
  it("renders in English for locale 'en'", async () => {
    const html = await render(
      OrganizationInvitationEmail({
        inviterName: "Jane Doe",
        inviterEmail: "jane@example.com",
        organizationName: "Acme Corp",
        role: "admin",
        acceptLink: "https://test.example.com/accepter-invitation/inv-123",
        locale: "en",
      }),
    );

    expect(html).toContain("You have been invited to join Acme Corp");
    expect(html).toContain("Accept the invitation");
  });

  it("renders in French for locale 'fr'", async () => {
    const html = await render(
      OrganizationInvitationEmail({
        inviterName: "Jean Dupont",
        inviterEmail: "jean@example.com",
        organizationName: "Acme Corp",
        role: "admin",
        acceptLink: "https://test.example.com/accepter-invitation/inv-123",
        locale: "fr",
      }),
    );

    expect(html).toContain("Vous avez été invité à rejoindre Acme Corp");
    expect(html).toContain("Accepter l&#x27;invitation");
  });
});
