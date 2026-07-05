"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { updateProjectAction } from "@/features/projects/actions/update-project.action";
import {
  projectStatuses,
  projectStatusLabels,
} from "@/features/projects/constants/project-filters.constant";
import {
  UpdateProjectSchema,
  type UpdateProjectSchemaType,
} from "@/features/projects/schemas/project.schema";
import type { ProjectItem } from "@/features/projects/services/get-projects.service";

import { type ProjectStatus } from "@/lib/generated/prisma/browser";

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
import { translateFieldErrors } from "@/utils/errors/translate-field-errors";

type EditProjectFormProps = {
  project: ProjectItem;
  onSuccess: () => void;
};

function EditProjectForm({ project, onSuccess }: EditProjectFormProps) {
  const t = useTranslations("projects.editForm");
  const tStatuses = useTranslations("projects.statuses");
  const tValidation = useTranslations("validation");
  const { executeAsync, isExecuting } = useAction(updateProjectAction);

  const form = useForm({
    defaultValues: {
      projectId: project.id,
      name: project.name,
      description: project.description ?? "",
      status: project.status,
    } as UpdateProjectSchemaType,
    validators: {
      onSubmit: UpdateProjectSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));

        toast.success(t("successToast"));

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
              <FieldLabel htmlFor="edit-project-name">
                {t("nameLabel")}
              </FieldLabel>
              <Input
                id="edit-project-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
              />
              {isInvalid && (
                <FieldError
                  errors={translateFieldErrors(
                    field.state.meta.errors,
                    tValidation,
                  )}
                />
              )}
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
              <FieldLabel htmlFor="edit-project-description">
                {t("descriptionLabel")}
              </FieldLabel>
              <Textarea
                id="edit-project-description"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
              />
              {isInvalid && (
                <FieldError
                  errors={translateFieldErrors(
                    field.state.meta.errors,
                    tValidation,
                  )}
                />
              )}
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
              <FieldLabel htmlFor="edit-project-status">
                {t("statusLabel")}
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) =>
                  field.handleChange(value as ProjectStatus)
                }
              >
                <SelectTrigger id="edit-project-status">
                  <SelectValue placeholder={t("statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status: ProjectStatus) => (
                    <SelectItem key={status} value={status}>
                      {tStatuses(projectStatusLabels[status])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && (
                <FieldError
                  errors={translateFieldErrors(
                    field.state.meta.errors,
                    tValidation,
                  )}
                />
              )}
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
            {isExecuting || isSubmitting
              ? t("submittingLabel")
              : t("submitLabel")}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { EditProjectForm };
