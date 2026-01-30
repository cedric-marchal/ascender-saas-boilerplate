import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { optimizeAvatar } from "@/lib/optimize";
import { prisma } from "@/lib/prisma";
import { deleteFile, getPublicUrl, uploadFile } from "@/lib/r2";
import { authenticatedRatelimit } from "@/lib/ratelimit";
import { UpdateAvatarSchema } from "@/lib/schemas/avatar.schema";
import { getSession } from "@/lib/session";

import {
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const AVATAR_FOLDER = "avatars";

async function deleteOldAvatar(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      image: true,
    },
  });

  if (!user?.image) {
    return;
  }

  const oldKey = user.image;

  if (!oldKey.startsWith(AVATAR_FOLDER)) {
    return;
  }

  try {
    await deleteFile(oldKey);
  } catch (error: unknown) {
    console.error("Failed to delete old avatar:", error);
  }
}

async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    await checkRatelimit(authenticatedRatelimit, session.user.id);

    const formData = await request.formData();

    const data = UpdateAvatarSchema.parse({
      avatar: formData.get("avatar"),
    });

    const arrayBuffer = await data.avatar.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimizedImage = await optimizeAvatar(buffer);

    const fileExtension = "webp";
    const sanitizedUserId = session.user.id.replace(/[^a-zA-Z0-9-]/g, "_");
    const fileName = `${sanitizedUserId}-${Date.now()}.${fileExtension}`;
    const fileKey = `${AVATAR_FOLDER}/${fileName}`;

    await uploadFile(fileKey, optimizedImage.buffer, "image/webp");

    await deleteOldAvatar(session.user.id);

    await auth.api.updateUser({
      body: {
        image: fileKey,
      },
      headers: await headers(),
    });

    const avatarUrl = getPublicUrl(fileKey);

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
