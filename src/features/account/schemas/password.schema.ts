import { z } from "zod";

import {
  MAX_PASSWORD_LENGTH,
  passwordSchema,
} from "@/features/auth/schemas/password.schema";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const UpdatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "validation.account.currentPasswordRequired")
      .max(MAX_PASSWORD_LENGTH, "validation.account.currentPasswordInvalid")
      .trim(),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, "validation.confirmPassword.required")
      .trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.confirmPassword.mismatch",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "validation.account.newPasswordSameAsCurrent",
    path: ["newPassword"],
  });

type UpdatePasswordSchemaType = z.infer<typeof UpdatePasswordSchema>;

export { UpdatePasswordSchema };

export type { UpdatePasswordSchemaType };
