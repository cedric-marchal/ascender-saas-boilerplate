"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { forgotPasswordAction } from "@/features/auth/actions/forgot-password.action";
import {
  ForgotPasswordSchema,
  type ForgotPasswordSchemaType,
} from "@/features/auth/schemas/auth.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";
import { translateFieldErrors } from "@/utils/errors/translate-field-errors";

function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tValidation = useTranslations("validation");
  const { executeAsync, isExecuting } = useAction(forgotPasswordAction);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    } as ForgotPasswordSchemaType,
    validators: {
      onSubmit: ForgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));
        setIsSubmitted(true);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  if (isSubmitted) {
    return (
      <div className="border-border bg-muted/50 rounded-md border p-4 text-center">
        <p className="text-foreground text-sm">{t("successMessage")}</p>
        <p className="text-muted-foreground mt-2 text-xs">{t("successHint")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
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
              <FieldLabel htmlFor="forgot-password-email">
                {t("emailLabel")}
              </FieldLabel>
              <Input
                id="forgot-password-email"
                type="email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="jean@exemple.fr"
                autoComplete="email"
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
              ? t("submittingLabel")
              : t("submitLabel")}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { ForgotPasswordForm };
