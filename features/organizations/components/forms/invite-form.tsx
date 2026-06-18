"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { inviteMemberAction } from "@/features/organizations/actions/invite-member.action";
import {
  InviteMemberSchema,
  ORGANIZATION_INVITATION_ROLES,
  type InviteMemberSchemaType,
  type OrganizationInvitationRole,
} from "@/features/organizations/schemas/invitation.schema";

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

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

const roleLabels: Record<OrganizationInvitationRole, string> = {
  admin: "Administrateur",
  member: "Membre",
};

type InviteFormProps = {
  onSuccess: () => void;
};

function InviteForm({ onSuccess }: InviteFormProps) {
  const { executeAsync, isExecuting } = useAction(inviteMemberAction);

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member",
    } as InviteMemberSchemaType,
    validators: {
      onSubmit: InviteMemberSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));

        toast.success("Invitation envoyée avec succès !");

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
        name="email"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="invite-email">Adresse email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="membre@exemple.com"
              />
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
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="invite-role">Rôle</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) =>
                  field.handleChange(value as OrganizationInvitationRole)
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_INVITATION_ROLES.map(
                    (role: OrganizationInvitationRole) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
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
            {isExecuting || isSubmitting ? "Envoi en cours..." : "Inviter"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { InviteForm };
