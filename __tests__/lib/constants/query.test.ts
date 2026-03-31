import { describe, expect, it } from "vitest";

import {
  MAX_ARRAY_LENGTH,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  PAGE_SIZE,
  PAGE_SIZES,
  SORT_ORDERS,
} from "@/lib/parsers/filters";

describe("Pagination constants", () => {
  it("has MAX_PAGE === 1000", () => {
    expect(MAX_PAGE).toBe(1000);
  });

  it("has PAGE_SIZE.SMALL === 10", () => {
    expect(PAGE_SIZE.SMALL).toBe(10);
  });

  it("has PAGE_SIZES array", () => {
    expect(PAGE_SIZES).toEqual([10, 20, 50, 100]);
  });

  it("PAGE_SIZE.SMALL is included in PAGE_SIZES", () => {
    expect(PAGE_SIZES).toContain(PAGE_SIZE.SMALL);
  });
});

describe("Filter constants", () => {
  it("has MAX_SEARCH_LENGTH === 100", () => {
    expect(MAX_SEARCH_LENGTH).toBe(100);
  });

  it("has MAX_ARRAY_LENGTH === 50", () => {
    expect(MAX_ARRAY_LENGTH).toBe(50);
  });
});

describe("Sort constants", () => {
  it("has SORT_ORDERS containing asc and desc", () => {
    expect(SORT_ORDERS).toEqual(["asc", "desc"]);
  });
});
