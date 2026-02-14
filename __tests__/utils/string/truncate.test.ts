import { describe, expect, it } from "vitest";

import {
  truncate,
  truncateDescription,
  truncateExcerpt,
  truncateName,
  truncatePreview,
  truncateTitle,
} from "@/utils/string/truncate";

describe("truncate", () => {
  it("returns truncated text with ellipsis when exceeding maxLength", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
  });

  it("returns original text when within maxLength", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("returns original text when exactly at maxLength", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("trims input before processing", () => {
    expect(truncate("  Hello  ", 10)).toBe("Hello");
  });

  it("returns empty string for empty input", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(truncate("   ", 10)).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(truncate(null as unknown as string, 10)).toBe("");
    expect(truncate(undefined as unknown as string, 10)).toBe("");
  });

  it("throws error when maxLength is less than 4", () => {
    expect(() => truncate("Hello", 3)).toThrow(
      "maxLength must be at least 4 for ellipsis"
    );
  });

  it("truncates to exactly maxLength including ellipsis", () => {
    const result = truncate("Hello World", 8);
    expect(result.length).toBe(8);
    expect(result).toBe("Hello...");
  });

  it("handles maxLength of 4 (minimum)", () => {
    const result = truncate("Hello World", 4);
    expect(result).toBe("H...");
    expect(result.length).toBe(4);
  });
});

describe("truncateTitle", () => {
  it("truncates at 60 characters", () => {
    const longTitle = "a".repeat(70);
    const result = truncateTitle(longTitle);
    expect(result.length).toBe(60);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns original when under 60 characters", () => {
    const shortTitle = "Short Title";
    expect(truncateTitle(shortTitle)).toBe("Short Title");
  });
});

describe("truncateDescription", () => {
  it("truncates at 160 characters", () => {
    const longDescription = "a".repeat(170);
    const result = truncateDescription(longDescription);
    expect(result.length).toBe(160);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns original when under 160 characters", () => {
    const shortDescription = "Short description";
    expect(truncateDescription(shortDescription)).toBe("Short description");
  });
});

describe("truncatePreview", () => {
  it("truncates at 200 characters", () => {
    const longPreview = "a".repeat(210);
    const result = truncatePreview(longPreview);
    expect(result.length).toBe(200);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns original when under 200 characters", () => {
    const shortPreview = "Short preview";
    expect(truncatePreview(shortPreview)).toBe("Short preview");
  });
});

describe("truncateExcerpt", () => {
  it("truncates at 300 characters", () => {
    const longExcerpt = "a".repeat(310);
    const result = truncateExcerpt(longExcerpt);
    expect(result.length).toBe(300);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns original when under 300 characters", () => {
    const shortExcerpt = "Short excerpt";
    expect(truncateExcerpt(shortExcerpt)).toBe("Short excerpt");
  });
});

describe("truncateName", () => {
  it("truncates at 20 characters", () => {
    const longName = "Jean-François Dupont de la Tour";
    const result = truncateName(longName);
    expect(result.length).toBe(20);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns original when under 20 characters", () => {
    const shortName = "Jean Dupont";
    expect(truncateName(shortName)).toBe("Jean Dupont");
  });

  it("returns original when exactly 20 characters", () => {
    const exactName = "a".repeat(20);
    expect(truncateName(exactName)).toBe(exactName);
  });
});
