import {
  createParser,
  parseAsStringLiteral,
  type SingleParserBuilder,
} from "nuqs/server";

import {
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  PAGE_SIZE,
  PAGE_SIZES,
  SORT_ORDERS,
} from "@/lib/parsers/filters";

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
      : PAGE_SIZE.SMALL;
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsOrder = parseAsStringLiteral(SORT_ORDERS);

function createEnumParser<const T extends readonly string[]>(
  enumValues: T,
): SingleParserBuilder<T[number]> {
  return parseAsStringLiteral(enumValues) as SingleParserBuilder<T[number]>;
}

function createSortByParser<const T extends readonly string[]>(
  allowedFields: T,
): SingleParserBuilder<T[number]> {
  return parseAsStringLiteral(allowedFields) as SingleParserBuilder<T[number]>;
}

export {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsPageSize,
  parseAsSafeSearch,
};
