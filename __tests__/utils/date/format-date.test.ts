import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatRelative,
  isValidDate,
  parseDate,
} from "@/utils/date/format-date";

describe("isValidDate", () => {
  it("returns true for valid Date", () => {
    expect(isValidDate(new Date("2024-01-15"))).toBe(true);
  });

  it("returns false for invalid Date", () => {
    expect(isValidDate(new Date("invalid"))).toBe(false);
  });

  it("returns false for NaN date", () => {
    expect(isValidDate(new Date(NaN))).toBe(false);
  });
});

describe("parseDate", () => {
  it("returns Date when given valid Date object", () => {
    const date = new Date("2024-01-15");
    expect(parseDate(date)).toEqual(date);
  });

  it("returns Date when given valid date string", () => {
    const result = parseDate("2024-01-15");
    expect(result).toBeInstanceOf(Date);
    expect(result).not.toBeNull();
  });

  it("returns null for invalid Date object", () => {
    expect(parseDate(new Date("invalid"))).toBeNull();
  });

  it("returns null for invalid string", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });

  it("returns null for non-date types", () => {
    expect(parseDate(123 as unknown as string)).toBeNull();
  });
});

describe("formatDate", () => {
  it("returns empty string for falsy input", () => {
    expect(formatDate({ date: "" as unknown as Date })).toBe("");
    expect(formatDate({ date: null as unknown as Date })).toBe("");
    expect(formatDate({ date: undefined as unknown as Date })).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate({ date: "invalid-date" })).toBe("");
    expect(formatDate({ date: new Date("invalid") })).toBe("");
  });

  it("formats date in short format (default)", () => {
    const result = formatDate({ date: new Date("2024-01-15") });
    expect(result).toMatch(/15\/01\/2024/);
  });

  it("formats date in long format", () => {
    const result = formatDate({
      date: new Date("2024-01-15"),
      format: "long",
    });
    expect(result).toMatch(/15/);
    expect(result).toMatch(/janvier/);
    expect(result).toMatch(/2024/);
  });

  it("formats date in relative format", () => {
    const now = new Date("2024-01-20");
    const result = formatDate({
      date: new Date("2024-01-20"),
      format: "relative",
      now,
    });
    expect(result).toBe("Aujourd'hui");
  });

  it("accepts string date input", () => {
    const result = formatDate({ date: "2024-01-15" });
    expect(result).toMatch(/15\/01\/2024/);
  });
});

describe("formatRelative", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("returns 'Aujourd'hui' for same day", () => {
    const date = new Date("2024-06-15T06:00:00Z");
    expect(formatRelative(date, now)).toBe("Aujourd'hui");
  });

  it("returns 'Hier' for yesterday", () => {
    const date = new Date("2024-06-14T12:00:00Z");
    expect(formatRelative(date, now)).toBe("Hier");
  });

  it("returns 'Il y a N jours' for 2-6 days ago", () => {
    const date = new Date("2024-06-12T12:00:00Z");
    expect(formatRelative(date, now)).toBe("Il y a 3 jours");
  });

  it("returns 'Il y a N semaine(s)' for 1-4 weeks ago", () => {
    const date = new Date("2024-06-08T12:00:00Z");
    expect(formatRelative(date, now)).toBe("Il y a 1 semaine");

    const twoWeeksAgo = new Date("2024-06-01T12:00:00Z");
    expect(formatRelative(twoWeeksAgo, now)).toBe("Il y a 2 semaines");
  });

  it("returns 'Il y a N mois' for 1-11 months ago", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    expect(formatRelative(date, now)).toBe("Il y a 3 mois");
  });

  it("returns 'Il y a 1 an' for singular year", () => {
    const date = new Date("2023-06-15T12:00:00Z");
    expect(formatRelative(date, now)).toBe("Il y a 1 an");
  });

  it("returns 'Il y a N ans' for plural years", () => {
    const date = new Date("2022-06-15T12:00:00Z");
    expect(formatRelative(date, now)).toBe("Il y a 2 ans");
  });

  it("returns empty string for future dates", () => {
    const futureDate = new Date("2024-07-15T12:00:00Z");
    expect(formatRelative(futureDate, now)).toBe("");
  });

  it("returns empty string for dates more than 10 years ago", () => {
    const oldDate = new Date("2013-01-01T12:00:00Z");
    expect(formatRelative(oldDate, now)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatRelative(new Date("invalid"))).toBe("");
  });
});
