import type { ReactNode } from "react";

import { headers } from "next/headers";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { CookieBanner } from "@/features/cookie-consent/components/cookie-banner";
import { GoogleAnalytics } from "@/features/cookie-consent/components/google-analytics";

import { env } from "@/lib/env";

import { Toaster } from "@/components/ui/sonner";

async function Providers({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        nonce={nonce}
      >
        {children}
        <Toaster />

        <CookieBanner />

        {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </ThemeProvider>
    </NuqsAdapter>
  );
}

export { Providers };
