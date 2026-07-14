import { z } from "zod";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const CreateCheckoutSessionSchema = z.object({
  priceId: z
    .string()
    .min(1, "validation.billing.priceIdRequired")
    .max(255, "validation.billing.priceIdInvalid")
    .trim(),
});

type CreateCheckoutSessionSchemaType = z.infer<
  typeof CreateCheckoutSessionSchema
>;

export { CreateCheckoutSessionSchema };

export type { CreateCheckoutSessionSchemaType };
