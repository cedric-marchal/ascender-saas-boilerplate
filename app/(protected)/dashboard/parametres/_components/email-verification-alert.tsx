"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function EmailVerificationAlert() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/email/resend-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsSent(true);
    } catch (error: unknown) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSent) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Email envoyé</AlertTitle>
        <AlertDescription>
          Un email de vérification a été envoyé à votre adresse.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Email non vérifié</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>
          Veuillez vérifier votre adresse email pour accéder à toutes les
          fonctionnalités.
        </span>
        {error && <span className="text-sm">{error}</span>}
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={handleResend}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Renvoyer l'email de vérification
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export { EmailVerificationAlert };
