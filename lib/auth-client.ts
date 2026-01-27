import { createAuthClient } from "better-auth/react";

import { env } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
});

export type AuthClientType = typeof authClient;

export const { useSession, signIn, signOut, signUp } = authClient;
