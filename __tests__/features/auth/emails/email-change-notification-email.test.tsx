import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { EmailChangeNotificationEmail } from "@/features/auth/emails/email-change-notification-email";

describe("EmailChangeNotificationEmail", () => {
  it("renders in English for locale 'en'", async () => {
    const html = await render(
      EmailChangeNotificationEmail({
        name: "Jane Doe",
        locale: "en",
      }),
    );

    expect(html).toContain("Email address change requested");
    expect(html).toContain("https://test.example.com/en/forgot-password");
  });

  it("renders in French for locale 'fr'", async () => {
    const html = await render(
      EmailChangeNotificationEmail({
        name: "Jean Dupont",
        locale: "fr",
      }),
    );

    expect(html).toContain("Modification d&#x27;adresse email demandée");
    expect(html).toContain("https://test.example.com/fr/mot-de-passe-oublie");
  });
});
