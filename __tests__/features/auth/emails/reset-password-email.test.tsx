import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { ResetPasswordEmail } from "@/features/auth/emails/reset-password-email";

describe("ResetPasswordEmail", () => {
  it("renders in English for locale 'en'", async () => {
    const html = await render(
      ResetPasswordEmail({
        name: "Jane Doe",
        resetLink: "https://test.example.com/en/reset-password?token=abc",
        locale: "en",
      }),
    );

    expect(html).toContain("Reset your TestApp password");
    expect(html).toContain("Password reset");
    expect(html).toContain("Hello Jane Doe,");
    expect(html).toContain("Reset my password");
    expect(html).toContain(
      "https://test.example.com/en/reset-password?token=abc",
    );
  });

  it("renders in French for locale 'fr'", async () => {
    const html = await render(
      ResetPasswordEmail({
        name: "Jean Dupont",
        resetLink: "https://test.example.com/fr/nouveau-mot-de-passe?token=abc",
        locale: "fr",
      }),
    );

    expect(html).toContain("Réinitialisez votre mot de passe TestApp");
    expect(html).toContain("Réinitialisation de mot de passe");
    expect(html).toContain("Bonjour Jean Dupont,");
    expect(html).toContain("Réinitialiser mon mot de passe");
    expect(html).toContain(
      "https://test.example.com/fr/nouveau-mot-de-passe?token=abc",
    );
  });

  it("never mixes locales — the English render contains no French copy", async () => {
    const html = await render(
      ResetPasswordEmail({
        name: "Jane Doe",
        resetLink: "https://test.example.com/en/reset-password?token=abc",
        locale: "en",
      }),
    );

    expect(html).not.toContain("Réinitialisation");
    expect(html).not.toContain("Bonjour");
  });
});
