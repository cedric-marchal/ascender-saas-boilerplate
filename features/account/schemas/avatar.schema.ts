import { z } from "zod";

import { env } from "@/lib/env";

const MAX_FILE_SIZE = env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const UpdateAvatarSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size > 0, "L'image est requise")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `L'image est trop volumineuse (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Format non supporté. Formats acceptés : JPEG, PNG, WebP",
    ),
});

type UpdateAvatarSchemaType = z.infer<typeof UpdateAvatarSchema>;

export { UpdateAvatarSchema };
export type { UpdateAvatarSchemaType };
