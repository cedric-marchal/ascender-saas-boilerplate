import { z } from "zod";

const CreateCheckoutSessionSchema = z.object({
  priceId: z
    .string()
    .min(1, "L'identifiant du prix est requis")
    .max(255, "L'identifiant du prix est invalide")
    .trim(),
});

type CreateCheckoutSessionSchemaType = z.infer<
  typeof CreateCheckoutSessionSchema
>;

export { CreateCheckoutSessionSchema };

export type { CreateCheckoutSessionSchemaType };
