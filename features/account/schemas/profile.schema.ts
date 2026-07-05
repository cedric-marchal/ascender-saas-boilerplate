import { z } from "zod";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(100, "validation.name.tooLong")
    .trim(),
  email: z
    .string()
    .min(1, "validation.email.required")
    .max(255, "validation.account.emailTooLong")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "validation.email.invalid" })),
});

type UpdateProfileSchemaType = z.infer<typeof UpdateProfileSchema>;

export { UpdateProfileSchema };

export type { UpdateProfileSchemaType };
