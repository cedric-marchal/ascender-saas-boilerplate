"use client";

import { useTransition, type ChangeEvent, type SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Filter, Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";

import {
  roleLabels,
  userRoleFilters,
  usersSearchParams,
  verificationFilters,
  verificationLabels,
  type UserRoleFilter,
  type VerificationFilter,
} from "@/features/users/constants/users-filters.constant";
import { FilterUsersSchema } from "@/features/users/schemas/users-filter.schema";

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

function UsersFilters() {
  const [isLoading, startTransition] = useTransition();

  const [urlFilters, setUrlFilters] = useQueryStates(usersSearchParams, {
    shallow: false,
    history: "push",
    startTransition,
  });

  const form = useForm({
    defaultValues: {
      search: urlFilters.search || "",
      role: urlFilters.role || ("all" as UserRoleFilter),
      verified: urlFilters.verified || ("all" as VerificationFilter),
    },
    validators: {
      onSubmit: FilterUsersSchema,
    },
    onSubmit: async ({ value }) => {
      setUrlFilters({
        search: value.search || null,
        role: value.role === "all" ? null : value.role,
        verified: value.verified === "all" ? null : value.verified,
        page: 1,
      });
    },
  });

  function handleClearFilters() {
    form.reset();
    setUrlFilters({
      search: null,
      role: null,
      verified: null,
      page: null,
    });
  }

  const hasActiveFilters =
    urlFilters.search ||
    urlFilters.role !== "all" ||
    urlFilters.verified !== "all";

  return (
    <section className="mb-6 space-y-4">
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
                    placeholder="Rechercher par nom ou email..."
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
          name="role"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="w-full sm:w-48">
                <FieldLabel htmlFor="filter-role" className="sr-only">
                  Rôle
                </FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) =>
                    field.handleChange(value as UserRoleFilter)
                  }
                >
                  <SelectTrigger id="filter-role">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoleFilters.map((role: UserRoleFilter) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="verified"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="w-full sm:w-48">
                <FieldLabel htmlFor="filter-verified" className="sr-only">
                  Statut
                </FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) =>
                    field.handleChange(value as VerificationFilter)
                  }
                >
                  <SelectTrigger id="filter-verified">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {verificationFilters.map((status: VerificationFilter) => (
                      <SelectItem key={status} value={status}>
                        {verificationLabels[status]}
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

export { UsersFilters };
