"use client";

import type { SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
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

const changeableRoleLabels: Record<OrganizationChangeableRole, string> = {
  admin: "Administrateur",
  member: "Membre",
};

type RoleFormProps = {
  memberId: string;
  currentRole: string;
  onSuccess: () => void;
};

function RoleForm({ memberId, currentRole, onSuccess }: RoleFormProps) {
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

        toast.success("Rôle modifié avec succès !");

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
              <FieldLabel htmlFor="role-select">Nouveau rôle</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) =>
                  field.handleChange(value as OrganizationChangeableRole)
                }
              >
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_CHANGEABLE_ROLES.map(
                    (role: OrganizationChangeableRole) => (
                      <SelectItem key={role} value={role}>
                        {changeableRoleLabels[role]}
                      </SelectItem>
                    ),
                  )}
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
            {isExecuting || isSubmitting
              ? "Modification en cours..."
              : "Modifier le rôle"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { RoleForm };
