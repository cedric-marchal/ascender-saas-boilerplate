import { describe, expect, it } from "vitest";

import { CreateCheckoutSessionSchema } from "@/features/billing/schemas/checkout.schema";

describe("CreateCheckoutSessionSchema", () => {
  it("accepts valid priceId", () => {
    const result = CreateCheckoutSessionSchema.safeParse({
      priceId: "price_1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("trims priceId", () => {
    const result = CreateCheckoutSessionSchema.safeParse({
      priceId: "  price_1234567890  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceId).toBe("price_1234567890");
    }
  });

  it("rejects empty priceId", () => {
    const result = CreateCheckoutSessionSchema.safeParse({ priceId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects priceId exceeding 255 characters", () => {
    const result = CreateCheckoutSessionSchema.safeParse({
      priceId: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("accepts priceId at max boundary (255 chars)", () => {
    const result = CreateCheckoutSessionSchema.safeParse({
      priceId: "a".repeat(255),
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-string types", () => {
    const result = CreateCheckoutSessionSchema.safeParse({ priceId: 123 });
    expect(result.success).toBe(false);
  });

  it("rejects missing priceId", () => {
    const result = CreateCheckoutSessionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
