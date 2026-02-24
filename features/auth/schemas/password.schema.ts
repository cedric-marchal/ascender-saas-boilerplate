import { z } from "zod";

const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
  )
  .max(
    MAX_PASSWORD_LENGTH,
    `Le mot de passe doit contenir moins de ${MAX_PASSWORD_LENGTH} caractères`,
  )
  .trim()
  .refine((pwd) => /[a-z]/.test(pwd), "Au moins une lettre minuscule")
  .refine((pwd) => /[A-Z]/.test(pwd), "Au moins une lettre majuscule")
  .refine((pwd) => /[0-9]/.test(pwd), "Au moins un chiffre");

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

export { passwordSchema, UpdatePasswordSchema };

export type { UpdatePasswordSchemaType };
