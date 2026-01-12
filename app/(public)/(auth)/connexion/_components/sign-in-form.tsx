"use client";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authClient, signIn } from "@/lib/auth-client";
import { SignInSchema, type SignInSchemaType } from "@/lib/schemas/auth.schema";
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

import { ForgotPasswordLink } from "@/app/(public)/(auth)/connexion/_components/forgot-password-link";

function SignInForm() {
  const router = useRouter();

  const form = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInSchemaType) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message || "Identifiants incorrects");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de passe</FormLabel>
                  <ForgotPasswordLink />
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
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
              ? "Connexion en cours..."
              : "Se connecter"}
          </Button>
        </form>
      </Form>

      <Button
        type="button"
        className="w-full"
        onClick={() => signIn.social({ provider: "google" })}
      >
        {form.formState.isSubmitting
          ? "Connexion en cours..."
          : "Se connecter avec Google"}
      </Button>
    </>
  );
}

export { SignInForm };
