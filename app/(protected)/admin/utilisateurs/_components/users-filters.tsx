"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";

import { Search, X } from "lucide-react";
import { createParser, parseAsStringLiteral, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDebounce } from "@/hooks/use-debounce";

const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;

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
    if (!query || query.length > MAX_SEARCH_LENGTH) {
      return "";
    }
    return query.trim();
  },
  serialize(value) {
    return value;
  },
});

const userRoles = ["all", "ADMIN", "CUSTOMER"] as const;
const userVerificationStatus = ["all", "verified", "unverified"] as const;

type UserRole = (typeof userRoles)[number];
type UserVerificationStatus = (typeof userVerificationStatus)[number];

const roleLabels: Record<UserRole, string> = {
  all: "Tous les rôles",
  ADMIN: "Admin",
  CUSTOMER: "Client",
};

const verificationLabels: Record<UserVerificationStatus, string> = {
  all: "Tous",
  verified: "Vérifiés",
  unverified: "Non vérifiés",
};

function UsersFilters() {
  const [isLoading, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput, 500);

  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsSafeSearch.withDefault(""),
      role: parseAsStringLiteral(userRoles).withDefault("all"),
      verified: parseAsStringLiteral(userVerificationStatus).withDefault("all"),
      page: parseAsPage.withDefault(1),
    },
    {
      shallow: false,
      startTransition,
      history: "push",
    }
  );

  useEffect(() => {
    setFilters({
      search: debouncedSearch || null,
      page: 1,
    });
  }, [debouncedSearch, setFilters]);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchInput(event.target.value);
  }

  function handleRoleChange(value: UserRole) {
    setFilters({
      role: value === "all" ? null : value,
      page: 1,
    });
  }

  function handleVerifiedChange(value: UserVerificationStatus) {
    setFilters({
      verified: value === "all" ? null : value,
      page: 1,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setFilters({
      search: null,
      role: null,
      verified: null,
      page: null,
    });
  }

  const hasActiveFilters =
    filters.search || filters.role !== "all" || filters.verified !== "all";

  return (
    <section className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Rechercher par nom ou email..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        <Select value={filters.role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            {userRoles.map((role: UserRole) => (
              <SelectItem key={role} value={role}>
                {roleLabels[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.verified} onValueChange={handleVerifiedChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {userVerificationStatus.map((status: UserVerificationStatus) => (
              <SelectItem key={status} value={status}>
                {verificationLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Effacer
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          Chargement...
        </div>
      )}
    </section>
  );
}

export { UsersFilters };
