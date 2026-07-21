"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteAccountAction } from "@/features/account/actions/delete-account.action";
import {
  DeleteAccountSchema,
  type DeleteAccountSchemaType,
} from "@/features/account/schemas/account.schema";
import { signOutAction } from "@/features/auth/actions/sign-out.action";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";
import { translateFieldErrors } from "@/utils/errors/translate-field-errors";

type DeleteAccountFormProps = {
  email: string;
  onSuccess: () => void;
};

function DeleteAccountForm({ email, onSuccess }: DeleteAccountFormProps) {
  const t = useTranslations("account.deleteAccountForm");
  const tValidation = useTranslations();
  const { executeAsync, isExecuting } = useAction(deleteAccountAction);

  const form = useForm({
    defaultValues: {
      confirmation: "",
    } as DeleteAccountSchemaType,
    validators: {
      onSubmit: DeleteAccountSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));

        toast.success(t("successToast"));
        await signOutAction().catch(() => {});

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
                {t("confirmationLabel")}
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
              <FieldDescription>{t("confirmationHint")}</FieldDescription>
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
              ? t("submittingLabel")
              : t("submitLabel")}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { DeleteAccountForm };
