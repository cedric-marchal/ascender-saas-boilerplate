import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type MemberRoleFilter = "all" | "owner" | "admin" | "member";

const memberRoleFilters = [
  "all",
  "owner",
  "admin",
  "member",
] as const satisfies readonly MemberRoleFilter[];

const membersSortableFields = ["name", "email", "createdAt"] as const;

type MemberSortableField = (typeof membersSortableFields)[number];

/**
 * Values are translation KEYS (resolved against the `organizations.roles`
 * message namespace via `useTranslations`), not literal labels.
 */
const memberRoleFilterLabels: Record<MemberRoleFilter, string> = {
  all: "all",
  owner: "owner",
  admin: "admin",
  member: "member",
};

const membersSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  role: createEnumParser(memberRoleFilters).withDefault("all"),
  sortBy: createSortByParser(membersSortableFields).withDefault("createdAt"),
  order: parseAsOrder.withDefault("asc"),
  page: parseAsPage.withDefault(1),
};

function isMemberRoleFilter(value: string): value is MemberRoleFilter {
  return (memberRoleFilters as readonly string[]).includes(value);
}

export {
  isMemberRoleFilter,
  memberRoleFilterLabels,
  memberRoleFilters,
  membersSearchParams,
  membersSortableFields,
};

export type { MemberRoleFilter, MemberSortableField };
