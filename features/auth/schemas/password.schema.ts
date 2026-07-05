import { z } from "zod";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace), not literal text — see `utils/errors/translate-field-errors.ts`
 * for the display-time resolution pattern shared by every schema. The
 * lengths are fixed constants (not user input), so the translated text in
 * `messages/*.json` embeds the numbers directly instead of interpolating.
 */
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, "validation.password.tooShort")
  .max(MAX_PASSWORD_LENGTH, "validation.password.tooLong")
  .trim()
  .refine((pwd) => /[a-z]/.test(pwd), "validation.password.lowercase")
  .refine((pwd) => /[A-Z]/.test(pwd), "validation.password.uppercase")
  .refine((pwd) => /[0-9]/.test(pwd), "validation.password.number");

export { MAX_PASSWORD_LENGTH, passwordSchema };
