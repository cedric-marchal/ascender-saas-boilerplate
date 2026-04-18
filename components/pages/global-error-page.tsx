"use client";

import { useEffect } from "react";

import { AlertTriangle } from "lucide-react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main
          className="bg-background flex min-h-screen flex-col items-center justify-center px-4"
          role="main"
          aria-labelledby="global-error-title"
        >
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle
                className="size-8 text-red-600"
                aria-hidden="true"
              />
            </div>

            <h1
              id="global-error-title"
              className="text-foreground mb-2 text-4xl font-bold"
            >
              Erreur critique
            </h1>

            <h2 className="text-foreground mb-3 text-xl font-semibold">
              Une erreur critique est survenue
            </h2>

            <p className="text-muted-foreground mb-8 text-sm">
              Désolé, une erreur critique s'est produite. Veuillez réessayer ou
              rafraîchir la page.
            </p>

            {error.digest && (
              <p className="text-muted-foreground mb-6 font-mono text-xs">
                Code : {error.digest}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Réessayer
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

export { GlobalErrorPage };
