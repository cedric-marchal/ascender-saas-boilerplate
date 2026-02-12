import { describe, expect, it } from "vitest";

import { CreateContactSchema } from "@/lib/schemas/contact.schema";

describe("CreateContactSchema", () => {
  const validData = {
    name: "Jean Dupont",
    email: "jean@exemple.fr",
    subject: "Demande de renseignements",
    message: "Bonjour, je souhaite obtenir plus d'informations sur vos services.",
  };

  it("accepts valid data", () => {
    const result = CreateContactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from all fields", () => {
    const result = CreateContactSchema.safeParse({
      name: "  Jean Dupont  ",
      email: "  JEAN@EXEMPLE.FR  ",
      subject: "  Sujet  ",
      message: "  Ceci est un message de test.  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jean Dupont");
      expect(result.data.email).toBe("jean@exemple.fr");
      expect(result.data.subject).toBe("Sujet");
      expect(result.data.message).toBe("Ceci est un message de test.");
    }
  });

  it("lowercases email", () => {
    const result = CreateContactSchema.safeParse({
      ...validData,
      email: "JEAN@EXEMPLE.FR",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jean@exemple.fr");
    }
  });

  describe("name", () => {
    it("rejects empty name", () => {
      const result = CreateContactSchema.safeParse({ ...validData, name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameErrors = result.error.issues.filter(
          (issue) => issue.path[0] === "name"
        );
        expect(nameErrors.length).toBeGreaterThan(0);
      }
    });

    it("rejects name exceeding 100 characters", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts name at max boundary (100 chars)", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email", () => {
    it("rejects empty email", () => {
      const result = CreateContactSchema.safeParse({ ...validData, email: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email exceeding 254 characters", () => {
      const longEmail = "a".repeat(250) + "@ex.fr";
      const result = CreateContactSchema.safeParse({
        ...validData,
        email: longEmail,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("subject", () => {
    it("rejects empty subject", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        subject: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects subject exceeding 200 characters", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        subject: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("accepts subject at max boundary (200 chars)", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        subject: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("message", () => {
    it("rejects message shorter than 10 characters", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        message: "Bonjour",
      });
      expect(result.success).toBe(false);
    });

    it("accepts message at min boundary (10 chars)", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        message: "a".repeat(10),
      });
      expect(result.success).toBe(true);
    });

    it("rejects message exceeding 5000 characters", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        message: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts message at max boundary (5000 chars)", () => {
      const result = CreateContactSchema.safeParse({
        ...validData,
        message: "a".repeat(5000),
      });
      expect(result.success).toBe(true);
    });
  });

  it("rejects non-string types", () => {
    const result = CreateContactSchema.safeParse({
      name: 123,
      email: true,
      subject: null,
      message: undefined,
    });
    expect(result.success).toBe(false);
  });
});
