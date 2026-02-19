import {
  FILTERS,
  PAGINATION,
  SORTING,
} from "@/lib/constants/query.constant";
import { describe, expect, it } from "vitest";

describe("PAGINATION", () => {
  it("has maxPage === 1000", () => {
    expect(PAGINATION.maxPage).toBe(1000);
  });

  it("has defaultPageSize === 12", () => {
    expect(PAGINATION.defaultPageSize).toBe(12);
  });

  it("has pageSizes array", () => {
    expect(PAGINATION.pageSizes).toEqual([10, 12, 20, 25, 50, 100]);
  });

  it("defaultPageSize is included in pageSizes", () => {
    expect(PAGINATION.pageSizes).toContain(PAGINATION.defaultPageSize);
  });
});

describe("FILTERS", () => {
  it("has maxSearchLength === 100", () => {
    expect(FILTERS.maxSearchLength).toBe(100);
  });

  it("has maxArrayLength === 50", () => {
    expect(FILTERS.maxArrayLength).toBe(50);
  });
});

describe("SORTING", () => {
  it("has orders containing asc and desc", () => {
    expect(SORTING.orders).toEqual(["asc", "desc"]);
  });

  it("has defaultOrder === 'desc'", () => {
    expect(SORTING.defaultOrder).toBe("desc");
  });

  it("has defaultSortBy === 'createdAt'", () => {
    expect(SORTING.defaultSortBy).toBe("createdAt");
  });

  it("defaultOrder is included in orders", () => {
    expect(SORTING.orders).toContain(SORTING.defaultOrder);
  });
});
