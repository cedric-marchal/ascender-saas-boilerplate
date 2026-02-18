import { createAuthClient } from "better-auth/react";

import { env } from "@/lib/env";

const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
});

export const { signIn, signOut, signUp, resetPassword, requestPasswordReset } =
  authClient;
