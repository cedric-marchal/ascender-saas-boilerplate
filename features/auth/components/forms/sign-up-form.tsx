"use client";

import { type ChangeEvent, type SubmitEvent, useState } from "react";

import { useRouter } from "next/navigation";

import {
  SignUpSchema,
  type SignUpSchemaType,
} from "@/features/auth/schemas/auth.schema";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient, signIn } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function SignUpForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();

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
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (error) {
        toast.error(error.message || "Erreur lors de l'inscription");
        return;
      }

      toast.success("Compte créé avec succès");
      router.push("/dashboard");
      router.refresh();
    },
  });

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
              disabled={!canSubmit || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {isSubmitting ? "Création en cours..." : "Créer un compte"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => signIn.social({ provider: "google" })}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isSubmitting
              ? "Inscription en cours..."
              : "Créer un compte avec Google"}
          </Button>
        )}
      </form.Subscribe>
    </>
  );
}

export { SignUpForm };
