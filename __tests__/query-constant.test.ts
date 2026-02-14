import { describe, expect, it } from "vitest";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";

describe("PAGINATION constants", () => {
  it("has a maxPage of 1000", () => {
    expect(PAGINATION.maxPage).toBe(1000);
  });

  it("has pageSizes array", () => {
    expect(PAGINATION.pageSizes).toEqual([10, 12, 20, 25, 50, 100]);
  });

  it("has defaultPageSize in pageSizes", () => {
    expect(PAGINATION.pageSizes).toContain(PAGINATION.defaultPageSize);
  });

  it("has defaultPageSize of 12", () => {
    expect(PAGINATION.defaultPageSize).toBe(12);
  });
});

describe("FILTERS constants", () => {
  it("has maxSearchLength of 100", () => {
    expect(FILTERS.maxSearchLength).toBe(100);
  });

  it("has maxArrayLength of 50", () => {
    expect(FILTERS.maxArrayLength).toBe(50);
  });
});

describe("SORTING constants", () => {
  it("has orders asc and desc", () => {
    expect(SORTING.orders).toEqual(["asc", "desc"]);
  });

  it("has defaultOrder of desc", () => {
    expect(SORTING.defaultOrder).toBe("desc");
  });

  it("has defaultSortBy of createdAt", () => {
    expect(SORTING.defaultSortBy).toBe("createdAt");
  });
});
