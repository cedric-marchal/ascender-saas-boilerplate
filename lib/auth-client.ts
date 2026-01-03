import { env } from "@/lib/env";
import { createAuthClient } from "better-auth/react";

import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});

export type AuthClientType = typeof authClient;

export const { useSession, signIn, signOut, signUp } = authClient;
