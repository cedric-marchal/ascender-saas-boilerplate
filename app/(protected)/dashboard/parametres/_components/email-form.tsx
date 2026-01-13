"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmailFormProps = {
  user: {
    email: string;
    emailVerified: boolean;
  };
};

function EmailForm({ user }: EmailFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/user/email", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message ?? "Une erreur est survenue");
        return;
      }

      toast.success(
        "Email mis à jour. Veuillez vérifier votre nouvelle adresse."
      );

      router.refresh();
    } catch (error: unknown) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adresse email</CardTitle>
        <CardDescription>
          Modifiez votre adresse email. Un changement nécessitera une nouvelle
          vérification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Email</Label>
              {user.emailVerified ? (
                <Badge variant="outline" className="gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Vérifié
                </Badge>
              ) : (
                <Badge variant="outline" className="text-destructive gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Non vérifié
                </Badge>
              )}
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { EmailForm };
