function createQueryConfig<
  TPageSizes extends readonly number[],
  TOrders extends readonly string[],
>(config: {
  pagination: {
    maxPage: number;
    pageSizes: TPageSizes;
    defaultPageSize: TPageSizes[number];
  };
  filters: {
    maxSearchLength: number;
    maxArrayLength: number;
  };
  sorting: {
    orders: TOrders;
    defaultOrder: TOrders[number];
    defaultSortBy: string;
  };
}) {
  return config;
}

const QUERY = createQueryConfig({
  pagination: {
    maxPage: 1000,
    pageSizes: [10, 12, 20, 25, 50, 100] as const,
    defaultPageSize: 12,
  },
  filters: {
    maxSearchLength: 100,
    maxArrayLength: 50,
  },
  sorting: {
    orders: ["asc", "desc"] as const,
    defaultOrder: "desc",
    defaultSortBy: "createdAt",
  },
});

const PAGINATION = QUERY.pagination;
const FILTERS = QUERY.filters;
const SORTING = QUERY.sorting;

export { FILTERS, PAGINATION, SORTING };
