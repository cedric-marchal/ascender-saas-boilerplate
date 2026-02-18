import { createParser, parseAsStringLiteral } from "nuqs/server";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";

const MAX_PAGE = PAGINATION.maxPage;
const MAX_SEARCH_LENGTH = FILTERS.maxSearchLength;
const SORT_ORDERS = SORTING.orders;

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

    return query.slice(0, MAX_SEARCH_LENGTH).trim();
  },
  serialize(value) {
    return value;
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
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
};

export type { SortOrder };
