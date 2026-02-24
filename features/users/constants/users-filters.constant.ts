import type { UserRole } from "@/lib/generated/prisma/client";
import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type UserRoleFilter = "all" | UserRole;
type VerificationFilter = "all" | "verified" | "unverified";

const userRoleFilters = ["all", "ADMIN", "CUSTOMER"] as const satisfies readonly UserRoleFilter[];
const verificationFilters = ["all", "verified", "unverified"] as const;
const usersSortableFields = ["name", "email", "createdAt"] as const;

type UserSortableField = (typeof usersSortableFields)[number];

const roleLabels: Record<UserRoleFilter, string> = {
  all: "Tous les rôles",
  ADMIN: "Administrateur",
  CUSTOMER: "Client",
};

const verificationLabels: Record<VerificationFilter, string> = {
  all: "Tous",
  verified: "Vérifiés",
  unverified: "Non vérifiés",
};

const usersSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  role: createEnumParser(userRoleFilters).withDefault("all"),
  verified: createEnumParser(verificationFilters).withDefault("all"),
  sortBy: createSortByParser(usersSortableFields).withDefault("createdAt"),
  order: parseAsOrder.withDefault("desc"),
  page: parseAsPage.withDefault(1),
};

function isUserRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "CUSTOMER";
}

function isUserRoleFilter(value: string): value is UserRoleFilter {
  return (userRoleFilters as readonly string[]).includes(value);
}

function isVerificationFilter(value: string): value is VerificationFilter {
  return (verificationFilters as readonly string[]).includes(value);
}

export {
  isUserRole,
  isUserRoleFilter,
  isVerificationFilter,
  roleLabels,
  userRoleFilters,
  usersSearchParams,
  usersSortableFields,
  verificationFilters,
  verificationLabels,
};

export type { UserRole, UserRoleFilter, UserSortableField, VerificationFilter };
