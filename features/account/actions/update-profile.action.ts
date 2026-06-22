"use server";

import { UpdateProfileSchema } from "@/features/account/schemas/profile.schema";
import { updateProfile } from "@/features/account/services/update-profile.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const updateProfileAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    return updateProfile({
      userId: ctx.userId,
      name: parsedInput.name,
      email: parsedInput.email,
    });
  });

export { updateProfileAction };
