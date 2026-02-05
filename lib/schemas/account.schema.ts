import { z } from "zod";

const DeleteAccountSchema = z.object({
  confirmation: z
    .string()
    .min(1, "La confirmation est requise")
    .max(255, "La confirmation est invalide")
    .trim(),
});

type DeleteAccountSchemaType = z.infer<typeof DeleteAccountSchema>;

export { DeleteAccountSchema };

export type { DeleteAccountSchemaType };
