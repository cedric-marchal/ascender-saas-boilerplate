import { createParser, parseAsStringLiteral } from "nuqs";

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
const DEFAULT_PAGE_SIZE = PAGE_SIZE.SMALL;

const SORT_ORDERS = ["asc", "desc"] as const;
const DEFAULT_SORT_ORDER = "desc" as const;
const DEFAULT_SORT_BY = "createdAt" as const;

type PageSize = (typeof PAGE_SIZES)[number];
type SortOrder = (typeof SORT_ORDERS)[number];

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }

    return Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query) {
      return "";
    }

    const normalized = query.normalize("NFC");
    const cleaned = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");

    return cleaned.slice(0, MAX_SEARCH_LENGTH).trim();
  },
  serialize(value) {
    return value;
  },
});

const parseAsPageSize = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);

    return (PAGE_SIZES as readonly number[]).includes(parsed)
      ? parsed
      : PAGE_SIZE.SMALL; // Fallback sur SMALL (10) si invalide
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsOrder = parseAsStringLiteral(SORT_ORDERS);

function createEnumParser<T extends readonly string[]>(enumValues: T) {
  return parseAsStringLiteral(enumValues);
}

function createSortByParser<T extends readonly string[]>(allowedFields: T) {
  return parseAsStringLiteral(allowedFields);
}

export {
  createEnumParser,
  createSortByParser,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MAX_ARRAY_LENGTH,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  PAGE_SIZE,
  PAGE_SIZES,
  parseAsOrder,
  parseAsPage,
  parseAsPageSize,
  parseAsSafeSearch,
  SORT_ORDERS,
};

export type { PageSize, SortOrder };
