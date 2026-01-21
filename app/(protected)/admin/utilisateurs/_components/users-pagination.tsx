"use client";

import { useTransition } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { createParser, useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";

const MAX_PAGE = 1000;

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

type UsersPaginationProps = {
  currentPage: number;
  totalPages: number;
};

function UsersPagination({
  currentPage,
  totalPages,
}: UsersPaginationProps) {
  const [isLoading, startTransition] = useTransition();

  const [, setPage] = useQueryState(
    "page",
    parseAsPage.withDefault(1).withOptions({
      shallow: false,
      startTransition,
      history: "push",
    })
  );

  function handlePrevious() {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-4"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage <= 1 || isLoading}
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Précédent
      </Button>

      <span className="text-sm text-gray-600">
        Page {currentPage} sur {totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage >= totalPages || isLoading}
      >
        Suivant
        <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

export { UsersPagination };
