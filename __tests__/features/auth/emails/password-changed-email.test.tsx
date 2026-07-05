import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { PasswordChangedEmail } from "@/features/auth/emails/password-changed-email";

describe("PasswordChangedEmail", () => {
  it("renders in English for locale 'en' with locale-prefixed links", async () => {
    const html = await render(
      PasswordChangedEmail({
        name: "Jane Doe",
        locale: "en",
      }),
    );

    expect(html).toContain("Password changed");
    expect(html).toContain("reset your password");
    expect(html).toContain("https://test.example.com/en/forgot-password");
    expect(html).toContain("https://test.example.com/en/contact");
  });

  it("renders in French for locale 'fr' with locale-prefixed links", async () => {
    const html = await render(
      PasswordChangedEmail({
        name: "Jean Dupont",
        locale: "fr",
      }),
    );

    expect(html).toContain("Mot de passe modifié");
    expect(html).toContain("réinitialiser votre mot de passe");
    expect(html).toContain("https://test.example.com/fr/mot-de-passe-oublie");
    expect(html).toContain("https://test.example.com/fr/contact");
  });
});
