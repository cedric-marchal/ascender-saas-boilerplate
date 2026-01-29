"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  UpdateProfileSchema,
  type UpdateProfileSchemaType,
} from "@/lib/schemas/profile.schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { EmailVerificationBadge } from "@/app/(protected)/admin/parametres/_components/email-verification-badge";

type AdminProfileFormProps = {
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
  };
};

function AdminProfileForm({ user }: AdminProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateProfileSchemaType>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  async function onSubmit(data: UpdateProfileSchemaType) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Une erreur est survenue");
        return;
      }

      if (result.data.emailChanged) {
        toast.success(
          "Profil mis à jour avec succès. Un email de vérification a été envoyé."
        );
      } else {
        toast.success("Profil mis à jour avec succès");
      }

      router.refresh();
    } catch (error: unknown) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="votre@email.com" {...field} />
              </FormControl>
              <FormDescription className="flex items-center gap-2">
                <EmailVerificationBadge isVerified={user.emailVerified} />
                {!user.emailVerified && (
                  <span className="text-xs text-orange-600">
                    Vérifiez votre email pour sécuriser votre compte
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </form>
    </Form>
  );
}

export { AdminProfileForm };
