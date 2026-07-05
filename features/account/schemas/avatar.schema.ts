import { z } from "zod";

import { env } from "@/lib/env";

const MAX_FILE_SIZE = env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`. `MAX_FILE_SIZE`
 * is a fixed env-derived constant (not user input), so the translated text
 * in `messages/*.json` embeds the size directly instead of interpolating.
 */
const UpdateAvatarSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size > 0, "validation.avatar.required")
    .refine((file) => file.size <= MAX_FILE_SIZE, "validation.avatar.tooLarge")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "validation.avatar.unsupportedFormat",
    ),
});

type UpdateAvatarSchemaType = z.infer<typeof UpdateAvatarSchema>;

export { UpdateAvatarSchema };
export type { UpdateAvatarSchemaType };
