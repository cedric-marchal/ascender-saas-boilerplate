"use client";

import { ErrorPage } from "@/components/pages/error-page";

type ErrorRouteProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorRoute({ error, reset }: ErrorRouteProps) {
  return <ErrorPage error={error} reset={reset} />;
}
