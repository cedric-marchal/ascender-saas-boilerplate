import { z } from "zod";

import {
  MAX_PASSWORD_LENGTH,
  passwordSchema,
} from "@/features/auth/schemas/password.schema";

const UpdatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Le mot de passe actuel est requis")
      .max(MAX_PASSWORD_LENGTH, "Le mot de passe actuel est invalide")
      .trim(),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "La confirmation est requise").trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'ancien",
    path: ["newPassword"],
  });

type UpdatePasswordSchemaType = z.infer<typeof UpdatePasswordSchema>;

export { UpdatePasswordSchema };

export type { UpdatePasswordSchemaType };
