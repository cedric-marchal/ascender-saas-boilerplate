"use client";

import { type ChangeEvent, type SubmitEvent, useState } from "react";

import { useRouter } from "next/navigation";

import {
  ResetPasswordSchema,
  type ResetPasswordSchemaType,
} from "@/features/auth/schemas/auth.schema";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { resetPassword } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ResetPasswordFormProps = {
  token: string;
};

function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    } as ResetPasswordSchemaType,
    validators: {
      onSubmit: ResetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await resetPassword({
        newPassword: value.password,
        token,
      });

      if (error) {
        toast.error(error.message || "Une erreur est survenue");
        return;
      }

      toast.success("Mot de passe mis à jour avec succès");
      router.push("/connexion");
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
              <div className="relative">
                <Input
                  id="reset-password-password"
                  type={isPasswordVisible ? "text" : "password"}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  aria-invalid={isInvalid}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIsPasswordVisible((previous: boolean) => !previous)
                  }
                  className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-9 w-9 items-center justify-center"
                  aria-label={
                    isPasswordVisible
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
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
              <div className="relative">
                <Input
                  id="reset-password-confirm"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  aria-invalid={isInvalid}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible(
                      (previous: boolean) => !previous
                    )
                  }
                  className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-9 w-9 items-center justify-center"
                  aria-label={
                    isConfirmPasswordVisible
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {isConfirmPasswordVisible ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
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
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isSubmitting
              ? "Mise à jour en cours..."
              : "Mettre à jour le mot de passe"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { ResetPasswordForm };
