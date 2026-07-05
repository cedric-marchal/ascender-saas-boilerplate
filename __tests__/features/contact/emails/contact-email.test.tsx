import { render } from "react-email";
import { describe, expect, it } from "vitest";

import { ContactEmail } from "@/features/contact/emails/contact-email";

describe("ContactEmail", () => {
  it("renders in English for locale 'en'", async () => {
    const html = await render(
      ContactEmail({
        name: "Jane Doe",
        email: "jane@example.com",
        subject: "Question",
        message: "Hello there",
        locale: "en",
      }),
    );

    expect(html).toContain("New contact message");
    expect(html).toContain("Subject");
    expect(html).toContain("Message");
  });

  it("renders in French for locale 'fr'", async () => {
    const html = await render(
      ContactEmail({
        name: "Jean Dupont",
        email: "jean@example.com",
        subject: "Question",
        message: "Bonjour",
        locale: "fr",
      }),
    );

    expect(html).toContain("Nouveau message de contact");
    expect(html).toContain("Sujet");
  });
});
