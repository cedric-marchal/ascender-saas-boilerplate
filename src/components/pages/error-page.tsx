"use client";

import { useEffect } from "react";

import type { Route } from "next";
import Link from "next/link";

import { ERROR_BOUNDARY_MESSAGES } from "@/i18n/error-boundary-messages";
import { getClientLocale } from "@/i18n/get-client-locale";
import { AlertTriangle } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error.digest ?? error.message);
  }, [error]);

  const messages = ERROR_BOUNDARY_MESSAGES[getClientLocale()];

  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
        </div>

        <h1
          id="error-title"
          className="text-foreground mb-2 text-4xl font-bold"
        >
          {messages.errorTitle}
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          {messages.errorHeading}
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">
          {messages.errorDescription}
        </p>

        {error.digest && (
          <p className="text-muted-foreground mb-6 font-mono text-xs">
            {messages.errorCode} {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            {messages.retry}
          </Button>

          <Button
            type="button"
            variant="outline"
            render={<Link href={"/" as Route} />}
          >
            {/* Plain next/link to the unlocalized root: the error boundary
                may render outside the [locale] segment's
                NextIntlClientProvider, so the i18n Link is avoided here.
                proxy.ts negotiates the correct locale on the next request. */}
            {messages.backHome}
          </Button>
        </div>
      </div>
    </Main>
  );
}

export { ErrorPage };
