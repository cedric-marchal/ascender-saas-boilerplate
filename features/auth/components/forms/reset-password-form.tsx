"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useRouter } from "@/i18n/navigation";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { resetPasswordAction } from "@/features/auth/actions/reset-password.action";
import {
  ResetPasswordActionSchema,
  type ResetPasswordActionSchemaType,
} from "@/features/auth/schemas/auth.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type ResetPasswordFormProps = {
  token: string;
};

function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(resetPasswordAction);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
      token,
    } as ResetPasswordActionSchemaType,
    validators: {
      onSubmit: ResetPasswordActionSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));
        toast.success("Mot de passe mis à jour avec succès");
        router.push("/sign-in");
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
      className="space-y-4"
    >
      <form.Field
        name="password"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="reset-password-password">
                Nouveau mot de passe
              </FieldLabel>
              <PasswordInput
                id="reset-password-password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Field
        name="confirmPassword"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="reset-password-confirm">
                Confirmer le mot de passe
              </FieldLabel>
              <PasswordInput
                id="reset-password-confirm"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
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
            className="w-full"
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting
              ? "Mise à jour en cours..."
              : "Mettre à jour le mot de passe"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { ResetPasswordForm };
