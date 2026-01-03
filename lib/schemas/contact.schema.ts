import { z } from "zod";

const ContactSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email doit contenir moins de 254 caractères")
    .transform((email) => email.toLowerCase().trim())
    .pipe(z.string().email("Format d'email invalide")),
  subject: z
    .string()
    .min(1, "Le sujet est requis")
    .max(200, "Le sujet doit contenir moins de 200 caractères"),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000, "Le message doit contenir moins de 5000 caractères"),
});

type ContactSchemaType = z.infer<typeof ContactSchema>;

export { ContactSchema };
export type { ContactSchemaType };
