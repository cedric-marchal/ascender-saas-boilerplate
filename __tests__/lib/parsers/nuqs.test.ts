import { describe, expect, it } from "vitest";

import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

describe("parseAsPage", () => {
  it("parses valid page number", () => {
    expect(parseAsPage.parse("1")).toBe(1);
    expect(parseAsPage.parse("5")).toBe(5);
    expect(parseAsPage.parse("100")).toBe(100);
  });

  it("returns 1 for negative numbers", () => {
    expect(parseAsPage.parse("-1")).toBe(1);
    expect(parseAsPage.parse("-100")).toBe(1);
  });

  it("returns 1 for zero", () => {
    expect(parseAsPage.parse("0")).toBe(1);
  });

  it("returns 1 for NaN input", () => {
    expect(parseAsPage.parse("abc")).toBe(1);
    expect(parseAsPage.parse("")).toBe(1);
  });

  it("caps at max page (1000)", () => {
    expect(parseAsPage.parse("1001")).toBe(1000);
    expect(parseAsPage.parse("9999")).toBe(1000);
  });

  it("allows max page exactly (1000)", () => {
    expect(parseAsPage.parse("1000")).toBe(1000);
  });

  it("serializes page number to string", () => {
    expect(parseAsPage.serialize(1)).toBe("1");
    expect(parseAsPage.serialize(42)).toBe("42");
  });
});

describe("parseAsSafeSearch", () => {
  it("parses valid search string", () => {
    expect(parseAsSafeSearch.parse("hello")).toBe("hello");
  });

  it("returns empty string for empty/falsy input", () => {
    expect(parseAsSafeSearch.parse("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(parseAsSafeSearch.parse("  hello  ")).toBe("hello");
  });

  it("truncates long strings to max length (100 chars)", () => {
    const longString = "a".repeat(150);
    const result = parseAsSafeSearch.parse(longString);
    expect(result!.length).toBeLessThanOrEqual(100);
  });

  it("preserves strings at max length", () => {
    const exactString = "a".repeat(100);
    expect(parseAsSafeSearch.parse(exactString)).toBe(exactString);
  });

  it("serializes string as-is", () => {
    expect(parseAsSafeSearch.serialize("hello")).toBe("hello");
  });
});

describe("parseAsOrder", () => {
  it("parses 'asc'", () => {
    expect(parseAsOrder.parse("asc")).toBe("asc");
  });

  it("parses 'desc'", () => {
    expect(parseAsOrder.parse("desc")).toBe("desc");
  });

  it("returns null for invalid order", () => {
    expect(parseAsOrder.parse("invalid")).toBeNull();
  });
});

describe("createEnumParser", () => {
  const testValues = ["option1", "option2", "option3"] as const;
  const parser = createEnumParser(testValues);

  it("parses valid enum value", () => {
    expect(parser.parse("option1")).toBe("option1");
    expect(parser.parse("option2")).toBe("option2");
    expect(parser.parse("option3")).toBe("option3");
  });

  it("returns null for invalid enum value", () => {
    expect(parser.parse("invalid")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parser.parse("")).toBeNull();
  });
});

describe("createSortByParser", () => {
  const allowedFields = ["name", "email", "createdAt"] as const;
  const parser = createSortByParser(allowedFields);

  it("parses valid field", () => {
    expect(parser.parse("name")).toBe("name");
    expect(parser.parse("email")).toBe("email");
    expect(parser.parse("createdAt")).toBe("createdAt");
  });

  it("returns null for invalid field", () => {
    expect(parser.parse("password")).toBeNull();
    expect(parser.parse("")).toBeNull();
  });
});
