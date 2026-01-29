import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { optimizeAvatar } from "@/lib/optimize";
import { prisma } from "@/lib/prisma";
import { authenticatedRatelimit } from "@/lib/ratelimit";
import { deleteFile, uploadFile } from "@/lib/r2";
import { UpdateAvatarSchema } from "@/lib/schemas/avatar.schema";
import { getSession } from "@/lib/session";

import {
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const AVATAR_FOLDER = "avatars";

async function deleteOldAvatar(userId: string) {
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

  const oldFileKey = user.image.replace("/", "");

  if (!oldFileKey.startsWith(AVATAR_FOLDER)) {
    return;
  }

  try {
    await deleteFile(oldFileKey);
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
    const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`;
    const fileKey = `${AVATAR_FOLDER}/${fileName}`;

    await uploadFile(fileKey, optimizedImage.buffer, "image/webp");

    const avatarUrl = `/${fileKey}`;

    await deleteOldAvatar(session.user.id);

    await auth.api.updateUser({
      body: {
        image: avatarUrl,
      },
      headers: await headers(),
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
