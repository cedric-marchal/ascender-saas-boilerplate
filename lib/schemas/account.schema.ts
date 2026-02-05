import { z } from "zod";

const DeleteAccountSchema = z.object({
  confirmation: z
    .string()
    .min(1, "La confirmation est requise")
    .max(254, "La confirmation est invalide")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Format d'email invalide" })),
});

type DeleteAccountSchemaType = z.infer<typeof DeleteAccountSchema>;

export { DeleteAccountSchema };

export type { DeleteAccountSchemaType };
