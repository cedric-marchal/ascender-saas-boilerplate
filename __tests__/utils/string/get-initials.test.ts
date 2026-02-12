import { describe, expect, it } from "vitest";

import { getInitials } from "@/utils/string/get-initials";

describe("getInitials", () => {
  it("returns initials for two-word name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns initials for multi-word name (max 2 chars)", () => {
    expect(getInitials("Jean Pierre Dupont")).toBe("JP");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("returns single initial for single-word name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("returns single char for one-char name", () => {
    expect(getInitials("J")).toBe("J");
  });

  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(getInitials("   ")).toBe("");
  });

  it("handles multiple spaces between words", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });

  it("returns empty string for non-string input", () => {
    expect(getInitials(null as unknown as string)).toBe("");
    expect(getInitials(undefined as unknown as string)).toBe("");
    expect(getInitials(123 as unknown as string)).toBe("");
  });

  it("handles names with accented characters", () => {
    expect(getInitials("Éric Dupont")).toBe("ÉD");
  });
});
