"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { signUpAction } from "@/features/auth/actions/sign-up.action";
import {
  SignUpSchema,
  type SignUpSchemaType,
} from "@/features/auth/schemas/auth.schema";

import { signIn } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function SignUpForm() {
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(signUpAction);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as SignUpSchemaType,
    validators: {
      onSubmit: SignUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));
        toast.success("Compte créé avec succès");
        router.push("/dashboard");
        router.refresh();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  async function handleGoogleSignUp() {
    const { error } = await signIn.social({ provider: "google" });

    if (error) {
      toast.error(error.message || "Une erreur est survenue");
    }
  }

  return (
    <>
      <form
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
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
                <FieldLabel htmlFor="sign-up-name">Nom</FieldLabel>
                <Input
                  id="sign-up-name"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  aria-invalid={isInvalid}
                  placeholder="Jean Dupont"
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
                <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                <Input
                  id="sign-up-email"
                  type="email"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  aria-invalid={isInvalid}
                  placeholder="jean@exemple.fr"
                  autoComplete="email"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

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
                <FieldLabel htmlFor="sign-up-password">Mot de passe</FieldLabel>
                <div className="relative">
                  <Input
                    id="sign-up-password"
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
                ? "Création en cours..."
                : "Créer un compte"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <Button type="button" onClick={handleGoogleSignUp} className="w-full">
        Créer un compte avec Google
      </Button>
    </>
  );
}

export { SignUpForm };
