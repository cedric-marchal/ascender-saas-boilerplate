const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;
const MAX_ARRAY_LENGTH = 50;

const PAGE_SIZE = {
  SMALL: 10,
  MEDIUM: 20,
  LARGE: 50,
  XLARGE: 100,
} as const;

const PAGE_SIZES = Object.values(PAGE_SIZE);
const SORT_ORDERS = ["asc", "desc"] as const;

type PageSize = (typeof PAGE_SIZES)[number];
type SortOrder = (typeof SORT_ORDERS)[number];

export {
  MAX_ARRAY_LENGTH,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  PAGE_SIZE,
  PAGE_SIZES,
  SORT_ORDERS,
};

export type { PageSize, SortOrder };
