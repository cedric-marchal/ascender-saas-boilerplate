import type { ReactNode } from "react";

import { headers } from "next/headers";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

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
      </ThemeProvider>
    </NuqsAdapter>
  );
}

export { Providers };
