"use client";

import { useEffect } from "react";

import { ERROR_BOUNDARY_MESSAGES } from "@/i18n/error-boundary-messages";
import { getClientLocale } from "@/i18n/get-client-locale";
import { AlertTriangle } from "lucide-react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error.digest ?? error.message);
  }, [error]);

  const locale = getClientLocale();
  const messages = ERROR_BOUNDARY_MESSAGES[locale];

  return (
    <html lang={locale}>
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
              {messages.globalErrorTitle}
            </h1>

            <h2 className="text-foreground mb-3 text-xl font-semibold">
              {messages.globalErrorHeading}
            </h2>

            <p className="text-muted-foreground mb-8 text-sm">
              {messages.globalErrorDescription}
            </p>

            {error.digest && (
              <p className="text-muted-foreground mb-6 font-mono text-xs">
                {messages.errorCode} {error.digest}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                {messages.retry}
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                {messages.backHome}
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

export { GlobalErrorPage };
