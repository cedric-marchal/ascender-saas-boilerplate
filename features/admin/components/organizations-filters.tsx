"use client";

import { useTransition, type ChangeEvent, type SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Filter, Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";

import { organizationsSearchParams } from "@/features/admin/constants/organizations-filters.constant";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function OrganizationsFilters() {
  const [isLoading, startTransition] = useTransition();

  const [urlFilters, setUrlFilters] = useQueryStates(
    organizationsSearchParams,
    {
      shallow: false,
      history: "push",
      startTransition,
    },
  );

  const form = useForm({
    defaultValues: {
      search: urlFilters.search || "",
    },
    onSubmit: async ({ value }) => {
      setUrlFilters({
        search: value.search || null,
        page: 1,
      });
    },
  });

  function handleClearFilters() {
    form.reset();
    setUrlFilters({
      search: null,
      page: null,
    });
  }

  const hasActiveFilters = Boolean(urlFilters.search);

  return (
    <section className="space-y-4">
      <form
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <form.Field
          name="search"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="relative flex-1">
                <div className="relative">
                  <Search
                    className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Rechercher par nom ou slug..."
                    className="pl-10"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(event.target.value)
                    }
                    aria-invalid={isInvalid}
                  />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isLoading}
              className="gap-2"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              {isLoading ? "Chargement..." : "Appliquer"}
            </Button>
          )}
        </form.Subscribe>

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
      </form>
    </section>
  );
}

export { OrganizationsFilters };
