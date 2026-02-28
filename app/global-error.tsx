"use client";

import { GlobalErrorPage } from "@/components/pages/global-error-page";

type GlobalErrorRouteProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorRoute({ error, reset }: GlobalErrorRouteProps) {
  return <GlobalErrorPage error={error} reset={reset} />;
}
