"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  ForgotPasswordSchema,
  type ForgotPasswordSchemaType,
} from "@/lib/schemas/auth.schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchemaType) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/nouveau-mot-de-passe",
    });

    if (error) {
      toast.error(error.message || "Une erreur est survenue");
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="border-border bg-muted/50 rounded-md border p-4 text-center">
        <p className="text-foreground text-sm">
          Si un compte existe avec cette adresse email, vous recevrez un lien de
          réinitialisation dans quelques instants.
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          Pensez à vérifier vos spams.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jean@exemple.fr"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Envoi en cours..."
            : "Envoyer le lien de réinitialisation"}
        </Button>
      </form>
    </Form>
  );
}

export { ForgotPasswordForm };
