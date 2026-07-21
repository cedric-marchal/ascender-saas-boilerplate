"use client";

import type { SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { changeMemberRoleAction } from "@/features/organizations/actions/change-member-role.action";
import {
  ChangeMemberRoleSchema,
  ORGANIZATION_CHANGEABLE_ROLES,
  type ChangeMemberRoleSchemaType,
  type OrganizationChangeableRole,
} from "@/features/organizations/schemas/member.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";
import { translateFieldErrors } from "@/utils/errors/translate-field-errors";

const changeableRoleLabels: Record<OrganizationChangeableRole, string> = {
  admin: "admin",
  member: "member",
};

type RoleFormProps = {
  memberId: string;
  currentRole: string;
  onSuccess: () => void;
};

function RoleForm({ memberId, currentRole, onSuccess }: RoleFormProps) {
  const t = useTranslations("organizations.roleForm");
  const tRoles = useTranslations("organizations.roles");
  const tValidation = useTranslations();
  const { executeAsync, isExecuting } = useAction(changeMemberRoleAction);

  const defaultRole = ORGANIZATION_CHANGEABLE_ROLES.includes(
    currentRole as OrganizationChangeableRole,
  )
    ? (currentRole as OrganizationChangeableRole)
    : "member";

  const form = useForm({
    defaultValues: {
      memberId,
      role: defaultRole,
    } as ChangeMemberRoleSchemaType,
    validators: {
      onSubmit: ChangeMemberRoleSchema,
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
        name="role"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="role-select">{t("label")}</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string | null) =>
                  field.handleChange(value as OrganizationChangeableRole)
                }
              >
                <SelectTrigger id="role-select">
                  <SelectValue placeholder={t("placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_CHANGEABLE_ROLES.map(
                    (role: OrganizationChangeableRole) => (
                      <SelectItem key={role} value={role}>
                        {tRoles(changeableRoleLabels[role])}
                      </SelectItem>
                    ),
                  )}
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

export { RoleForm };
