import { z } from "zod";

const nameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(100, "Le nom doit contenir moins de 100 caractères")
  .trim();

const updateProfileSchema = z.object({
  name: nameSchema.optional(),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export { updateProfileSchema, nameSchema };
export type { UpdateProfileInput };
