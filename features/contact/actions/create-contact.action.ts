"use server";

import { CreateContactSchema } from "@/features/contact/schemas/contact.schema";
import { createContact } from "@/features/contact/services/create-contact.service";

import { contactRatelimit } from "@/lib/ratelimit";
import { actionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getActionIdentifier } from "@/utils/ratelimit/get-request-identifier";

export const createContactAction = actionClient
  .use(async ({ next }) => {
    const identifier = await getActionIdentifier();
    await checkRatelimit(contactRatelimit, identifier);
    return next();
  })
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await createContact(parsedInput);

    return { success: true };
  });
