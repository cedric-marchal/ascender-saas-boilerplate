import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { AccountDeletedEmail } from "@/features/account/emails/account-deleted-email";

describe("AccountDeletedEmail", () => {
  it("renders in English for locale 'en' with a locale-prefixed contact link", async () => {
    const html = await render(
      AccountDeletedEmail({
        name: "Jane Doe",
        locale: "en",
      }),
    );

    expect(html).toContain("Account deleted");
    expect(html).toContain("https://test.example.com/en/contact");
  });

  it("renders in French for locale 'fr' with a locale-prefixed contact link", async () => {
    const html = await render(
      AccountDeletedEmail({
        name: "Jean Dupont",
        locale: "fr",
      }),
    );

    expect(html).toContain("Compte supprimé");
    expect(html).toContain("https://test.example.com/fr/contact");
  });
});
