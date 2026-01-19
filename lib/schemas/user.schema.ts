import { z } from "zod";

const nameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(100, "Le nom doit contenir moins de 100 caractères")
  .trim();

const UpdateProfileSchema = z.object({
  name: nameSchema.optional(),
});

type UpdateProfileSchemaType = z.infer<typeof UpdateProfileSchema>;

export { UpdateProfileSchema, nameSchema };

export type { UpdateProfileSchemaType };
