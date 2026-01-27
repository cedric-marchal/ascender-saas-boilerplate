import { NextResponse } from "next/server";

import { optimizeAvatar } from "@/lib/optimize";
import { prisma } from "@/lib/prisma";
import { deleteFile, uploadFile } from "@/lib/r2";
import { UpdateAvatarSchema } from "@/lib/schemas/avatar.schema";
import { getSession } from "@/lib/session";

import {
  BadRequestError,
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";

const AVATAR_FOLDER = "avatars";

async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      throw new BadRequestError("Le fichier avatar est requis");
    }

    const data = UpdateAvatarSchema.parse({
      avatar: file,
    });

    const arrayBuffer = await data.avatar.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimizedImage = await optimizeAvatar(buffer);

    const fileExtension = "webp";
    const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`;
    const fileKey = `${AVATAR_FOLDER}/${fileName}`;

    await uploadFile(fileKey, optimizedImage.buffer, "image/webp");

    const avatarUrl = `/${fileKey}`;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        image: true,
      },
    });

    if (user?.image) {
      const oldFileKey = user.image.replace(`/`, "");

      if (oldFileKey.startsWith(AVATAR_FOLDER)) {
        try {
          await deleteFile(oldFileKey);
        } catch (error: unknown) {
          console.error("Failed to delete old avatar:", error);
        }
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          avatarUrl,
          size: optimizedImage.size,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
