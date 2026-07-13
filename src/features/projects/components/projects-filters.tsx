"use client";

import { useTransition, type ChangeEvent, type SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Filter, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

import {
  projectsSearchParams,
  projectStatusFilters,
  projectStatusLabels,
  type ProjectStatusFilter,
} from "@/features/projects/constants/project-filters.constant";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ProjectsFilters() {
  const t = useTranslations("projects.filters");
  const tStatuses = useTranslations("projects.statuses");
  const [isLoading, startTransition] = useTransition();

  const [urlFilters, setUrlFilters] = useQueryStates(projectsSearchParams, {
    shallow: false,
    history: "push",
    startTransition,
  });

  const form = useForm({
    defaultValues: {
      search: urlFilters.search || "",
      status: urlFilters.status || ("all" as ProjectStatusFilter),
    },
    onSubmit: async ({ value }) => {
      setUrlFilters({
        search: value.search || null,
        status: value.status === "all" ? null : value.status,
        page: 1,
      });
    },
  });

  function handleClearFilters() {
    form.reset();
    setUrlFilters({
      search: null,
      status: null,
      page: null,
    });
  }

  const hasActiveFilters = urlFilters.search || urlFilters.status !== "all";

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
                    placeholder={t("searchPlaceholder")}
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

        <form.Field
          name="status"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="w-full sm:w-48">
                <FieldLabel
                  htmlFor="projects-filter-status"
                  className="sr-only"
                >
                  {t("statusLabel")}
                </FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) =>
                    field.handleChange(value as ProjectStatusFilter)
                  }
                >
                  <SelectTrigger id="projects-filter-status">
                    <SelectValue placeholder={t("statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusFilters.map((status: ProjectStatusFilter) => (
                      <SelectItem key={status} value={status}>
                        {tStatuses(projectStatusLabels[status])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {isLoading ? t("loadingButton") : t("applyButton")}
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
            {t("clearButton")}
          </Button>
        )}
      </form>
    </section>
  );
}

export { ProjectsFilters };
