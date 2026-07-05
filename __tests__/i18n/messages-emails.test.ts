import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { describe, expect, it } from "vitest";

const EMAIL_TEMPLATE_NAMESPACES = [
  "resetPassword",
  "welcome",
  "passwordChanged",
  "emailChangeNotification",
  "organizationInvitation",
  "accountDeleted",
  "contact",
] as const;

describe("messages: emails.* namespace", () => {
  it("has an emails namespace in both catalogs", () => {
    expect(en).toHaveProperty("emails");
    expect(fr).toHaveProperty("emails");
  });

  it.each(EMAIL_TEMPLATE_NAMESPACES)(
    "has a subject key for emails.%s in both locales",
    (namespace: (typeof EMAIL_TEMPLATE_NAMESPACES)[number]) => {
      expect(en.emails).toHaveProperty(namespace);
      expect(fr.emails).toHaveProperty(namespace);
      expect(
        (en.emails as Record<string, Record<string, string>>)[namespace],
      ).toHaveProperty("subject");
      expect(
        (fr.emails as Record<string, Record<string, string>>)[namespace],
      ).toHaveProperty("subject");
    },
  );

  it("has the shared common.securityFromName / noreplyFromName sender keys", () => {
    expect(en.emails.common).toHaveProperty("securityFromName");
    expect(en.emails.common).toHaveProperty("noreplyFromName");
    expect(fr.emails.common).toHaveProperty("securityFromName");
    expect(fr.emails.common).toHaveProperty("noreplyFromName");
  });
});
