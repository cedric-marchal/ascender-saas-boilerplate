import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { WelcomeEmail } from "@/features/auth/emails/welcome-email";

describe("WelcomeEmail", () => {
  it("renders in English for locale 'en'", async () => {
    const html = await render(
      WelcomeEmail({
        name: "Jane Doe",
        verificationLink: "https://test.example.com/en/verify?token=abc",
        locale: "en",
      }),
    );

    expect(html).toContain("Welcome to TestApp!");
    expect(html).toContain("Verify my email address");
  });

  it("renders in French for locale 'fr'", async () => {
    const html = await render(
      WelcomeEmail({
        name: "Jean Dupont",
        verificationLink: "https://test.example.com/fr/verify?token=abc",
        locale: "fr",
      }),
    );

    expect(html).toContain("Bienvenue sur TestApp !");
    expect(html).toContain("Vérifier mon adresse email");
  });
});
