"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createProjectAction } from "@/features/projects/actions/create-project.action";
import {
  projectStatuses,
  projectStatusLabels,
} from "@/features/projects/constants/project-filters.constant";
import {
  CreateProjectSchema,
  type CreateProjectSchemaType,
} from "@/features/projects/schemas/project.schema";

import { ProjectStatus } from "@/lib/generated/prisma/browser";

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
import { Textarea } from "@/components/ui/textarea";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type CreateProjectFormProps = {
  onSuccess: () => void;
};

function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const { executeAsync, isExecuting } = useAction(createProjectAction);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      status: ProjectStatus.DRAFT,
    } as CreateProjectSchemaType,
    validators: {
      onSubmit: CreateProjectSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));

        toast.success("Projet créé avec succès !");

        form.reset();
        onSuccess();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="name"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="create-project-name">Nom</FieldLabel>
              <Input
                id="create-project-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="Refonte du site marketing"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Field
        name="description"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="create-project-description">
                Description
              </FieldLabel>
              <Textarea
                id="create-project-description"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="Décrivez l'objectif du projet"
              />
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
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="create-project-status">Statut</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) =>
                  field.handleChange(value as ProjectStatus)
                }
              >
                <SelectTrigger id="create-project-status">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status: ProjectStatus) => (
                    <SelectItem key={status} value={status}>
                      {projectStatusLabels[status]}
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
            disabled={!canSubmit || isExecuting || isSubmitting}
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting ? "Création en cours..." : "Créer"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { CreateProjectForm };
