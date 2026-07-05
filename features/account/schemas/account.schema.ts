import { z } from "zod";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const DeleteAccountSchema = z.object({
  confirmation: z
    .string()
    .min(1, "validation.account.confirmationRequired")
    .max(254, "validation.account.confirmationInvalid")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "validation.email.invalid" })),
});

type DeleteAccountSchemaType = z.infer<typeof DeleteAccountSchema>;

export { DeleteAccountSchema };

export type { DeleteAccountSchemaType };
