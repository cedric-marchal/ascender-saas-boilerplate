import { describe, expect, it } from "vitest";

import { slugify } from "@/utils/string/slugify";

describe("slugify", () => {
  it("converts basic text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles accented characters", () => {
    expect(slugify("Café Münchën")).toBe("cafe-munchen");
  });

  it("removes special characters", () => {
    expect(slugify("Hello World!@#$%")).toBe("hello-world");
  });

  it("collapses multiple spaces to single hyphen", () => {
    expect(slugify("Hello    World")).toBe("hello-world");
  });

  it("collapses multiple hyphens to single hyphen", () => {
    expect(slugify("Hello---World")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -Hello World-  ")).toBe("hello-world");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(slugify("   ")).toBe("");
  });

  it("truncates to max 100 characters", () => {
    const longText = "a".repeat(200);
    expect(slugify(longText).length).toBeLessThanOrEqual(100);
  });

  it("handles French text correctly", () => {
    expect(slugify("Découvrez nos offres")).toBe("decouvrez-nos-offres");
  });
});
