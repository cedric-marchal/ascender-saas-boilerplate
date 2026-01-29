import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(255, "L'email doit contenir moins de 255 caractères")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Format d'email invalide" })),
});

type UpdateProfileSchemaType = z.infer<typeof UpdateProfileSchema>;

export { UpdateProfileSchema };

export type { UpdateProfileSchemaType };
