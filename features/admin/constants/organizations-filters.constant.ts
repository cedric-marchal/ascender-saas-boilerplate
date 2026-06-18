import {
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

const organizationsSortableFields = ["name", "plan", "createdAt"] as const;

type OrganizationSortableField = (typeof organizationsSortableFields)[number];

const organizationsSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  sortBy: createSortByParser(organizationsSortableFields).withDefault(
    "createdAt",
  ),
  order: parseAsOrder.withDefault("desc"),
  page: parseAsPage.withDefault(1),
};

export { organizationsSortableFields, organizationsSearchParams };

export type { OrganizationSortableField };
