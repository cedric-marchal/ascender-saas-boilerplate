"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import {
  DeleteAccountSchema,
  type DeleteAccountSchemaType,
} from "@/lib/schemas/account.schema";

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

type AdminDeleteAccountFormProps = {
  email: string;
  onSuccess: () => void;
};

function AdminDeleteAccountForm({
  email,
  onSuccess,
}: AdminDeleteAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DeleteAccountSchemaType>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      confirmation: "",
    },
  });

  async function onSubmit(data: DeleteAccountSchemaType) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("confirmation", data.confirmation);

      const response = await fetch("/api/account", {
        method: "DELETE",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Une erreur est survenue");
      }

      toast.success("Votre compte a été supprimé avec succès");
      await signOut().catch(() => {});
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="confirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmation</FormLabel>
              <FormControl>
                <Input placeholder={email} {...field} />
              </FormControl>
              <FormDescription>
                Tapez votre adresse email pour confirmer la suppression
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="destructive"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Suppression..." : "Supprimer mon compte"}
        </Button>
      </form>
    </Form>
  );
}

export { AdminDeleteAccountForm };
