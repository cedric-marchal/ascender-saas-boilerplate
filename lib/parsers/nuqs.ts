import { createParser, parseAsStringLiteral } from "nuqs/server";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";

type PageSize = (typeof PAGINATION.pageSizes)[number];
type SortOrder = (typeof SORTING.orders)[number];

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }

    return Math.min(parsed, PAGINATION.maxPage);
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

    return query.slice(0, FILTERS.maxSearchLength).trim();
  },
  serialize(value) {
    return value;
  },
});

const parseAsOrder = parseAsStringLiteral(SORTING.orders);

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

export type { PageSize, SortOrder };
