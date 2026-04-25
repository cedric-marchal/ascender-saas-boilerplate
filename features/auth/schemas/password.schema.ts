import { z } from "zod";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

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

export { MAX_PASSWORD_LENGTH, passwordSchema };
