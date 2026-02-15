import { z } from "zod";

const CreateContactSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email doit contenir moins de 254 caractères")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Format d'email invalide" })),
  subject: z
    .string()
    .min(1, "Le sujet est requis")
    .max(200, "Le sujet doit contenir moins de 200 caractères")
    .trim(),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000, "Le message doit contenir moins de 5000 caractères")
    .trim(),
});

type CreateContactSchemaType = z.infer<typeof CreateContactSchema>;

export { CreateContactSchema };

export type { CreateContactSchemaType };
