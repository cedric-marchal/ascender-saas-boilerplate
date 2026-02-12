"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import {
  DeleteAccountSchema,
  type DeleteAccountSchemaType,
} from "@/lib/schemas/account.schema";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { deleteAccountAction } from "@/app/(protected)/_actions/delete-account.action";

type DeleteAccountFormProps = {
  email: string;
  onSuccess: () => void;
};

function DeleteAccountForm({ email, onSuccess }: DeleteAccountFormProps) {
  const { executeAsync, isExecuting } = useAction(deleteAccountAction);

  const form = useForm({
    defaultValues: {
      confirmation: "",
    } as DeleteAccountSchemaType,
    validators: {
      onSubmit: DeleteAccountSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await executeAsync(value);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.success) {
        toast.success("Votre compte a été supprimé avec succès");
        await signOut().catch(() => {});
        onSuccess();
      }
    },
  });

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="confirmation"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="settings-delete-confirmation">
                Confirmation
              </FieldLabel>
              <Input
                id="settings-delete-confirmation"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder={email}
              />
              <FieldDescription>
                Tapez votre adresse email pour confirmer la suppression
              </FieldDescription>
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
            variant="destructive"
            disabled={!canSubmit || isExecuting || isSubmitting}
            className="w-full"
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting
              ? "Suppression..."
              : "Supprimer mon compte"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { DeleteAccountForm };
