import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { optimizeAvatar } from "@/lib/optimize";
import { prisma } from "@/lib/prisma";
import { deleteFile, uploadFile } from "@/lib/r2";
import { UpdateProfileSchema } from "@/lib/schemas/user.schema";
import { requireSession } from "@/lib/session";

import {
  BadRequestError,
  PayloadTooLargeError,
  UnprocessableEntityError,
  handleApiError,
} from "@/utils/api/handle-api-error";

const MAX_FILE_SIZE = env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const contentLength = request.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
      throw new PayloadTooLargeError("Le fichier ne doit pas dépasser 4.5MB");
    }

    const formData = await request.formData().catch(() => {
      throw new BadRequestError("Requête invalide");
    });

    const name = formData.get("name") as string | null;
    const image = formData.get("image") as File | null;
    const hasImage = image && image.size > 0;

    if (!name && !hasImage) {
      throw new BadRequestError("Aucune donnée à mettre à jour");
    }

    const updateData: { name?: string; image?: string } = {};

    if (name) {
      const validated = UpdateProfileSchema.parse({ name });
      updateData.name = validated.name;
    }

    if (hasImage) {
      if (!ALLOWED_TYPES.includes(image.type)) {
        throw new UnprocessableEntityError(
          "Format accepté : JPEG, PNG, WebP, GIF"
        );
      }

      if (image.size > MAX_FILE_SIZE) {
        throw new PayloadTooLargeError("L'image ne doit pas dépasser 4.5MB");
      }

      const buffer = Buffer.from(await image.arrayBuffer());
      const optimized = await optimizeAvatar(buffer);

      if (!optimized.success) {
        throw new UnprocessableEntityError("Impossible de traiter l'image");
      }

      const key = `avatars/${userId}.webp`;

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      if (currentUser?.image?.startsWith("avatars/")) {
        await deleteFile(currentUser.image);
      }

      const uploaded = await uploadFile(key, optimized.buffer, "image/webp");

      if (!uploaded) {
        throw new Error("Échec de l'upload de l'image");
      }

      updateData.image = key;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { PATCH };
