"use client";

import { useTransition } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState } from "nuqs";

import { parseAsPage } from "@/lib/parsers/nuqs";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

function Pagination({ currentPage, totalPages }: PaginationProps) {
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

export { Pagination };
