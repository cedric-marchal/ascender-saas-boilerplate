/* eslint-disable react/no-children-prop */
"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  UpdateProfileSchema,
  type UpdateProfileSchemaType,
} from "@/lib/schemas/profile.schema";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { updateProfileAction } from "@/app/(protected)/_actions/update-profile.action";
import { EmailVerificationBadge } from "@/app/(protected)/admin/parametres/_components/email-verification-badge";

type AdminProfileFormProps = {
  name: string;
  email: string;
  emailVerified: boolean;
};

function AdminProfileForm({
  name,
  email,
  emailVerified,
}: AdminProfileFormProps) {
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(updateProfileAction);

  const form = useForm({
    defaultValues: {
      name: name,
      email: email,
    } as UpdateProfileSchemaType,
    validators: {
      onSubmit: UpdateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await executeAsync(value);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data) {
        toast.success(
          result.data.emailChanged
            ? "Profil mis à jour avec succès. Un email de vérification a été envoyé."
            : "Profil mis à jour avec succès"
        );

        router.refresh();
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
              <FieldLabel htmlFor="admin-profile-name">Nom</FieldLabel>
              <Input
                id="admin-profile-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="Votre nom"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

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
              <FieldLabel htmlFor="admin-profile-email">Email</FieldLabel>
              <Input
                id="admin-profile-email"
                type="email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="votre@email.com"
              />
              <FieldDescription className="flex items-center gap-2">
                <EmailVerificationBadge isVerified={emailVerified} />
                {!emailVerified && (
                  <span className="text-xs text-orange-600">
                    Vérifiez votre email pour sécuriser votre compte
                  </span>
                )}
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
            disabled={!canSubmit || isExecuting || isSubmitting}
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { AdminProfileForm };
