import { z } from "zod";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace), not literal text — see `utils/errors/translate-field-errors.ts`
 * for the display-time resolution pattern shared by every schema.
 */
const CreateContactSchema = z.object({
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(100, "validation.name.tooLong")
    .trim(),
  email: z
    .string()
    .min(1, "validation.email.required")
    .max(254, "validation.email.tooLong")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "validation.email.invalid" })),
  subject: z
    .string()
    .min(1, "validation.contact.subject.required")
    .max(200, "validation.contact.subject.tooLong")
    .trim(),
  message: z
    .string()
    .min(10, "validation.contact.message.tooShort")
    .max(5000, "validation.contact.message.tooLong")
    .trim(),
});

type CreateContactSchemaType = z.infer<typeof CreateContactSchema>;

export { CreateContactSchema };

export type { CreateContactSchemaType };
