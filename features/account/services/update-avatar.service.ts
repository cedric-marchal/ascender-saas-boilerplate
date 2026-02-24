import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { optimizeAvatar } from "@/lib/optimize";
import { prisma } from "@/lib/prisma";
import { deleteFile, getPublicUrl, uploadFile } from "@/lib/r2";

const AVATAR_FOLDER = "avatars";

type UpdateAvatarInput = {
  userId: string;
  avatar: File;
};

type UpdateAvatarResult = {
  avatarUrl: string;
  size: number;
};

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

async function updateAvatar(
  input: UpdateAvatarInput,
): Promise<UpdateAvatarResult> {
  const arrayBuffer = await input.avatar.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const optimizedImage = await optimizeAvatar(buffer);

  const fileExtension = "webp";
  const sanitizedUserId = input.userId.replace(/[^a-zA-Z0-9-]/g, "_");
  const fileName = `${sanitizedUserId}-${Date.now()}.${fileExtension}`;
  const fileKey = `${AVATAR_FOLDER}/${fileName}`;

  await uploadFile(fileKey, optimizedImage.buffer, "image/webp");

  await deleteOldAvatar(input.userId);

  await auth.api.updateUser({
    body: {
      image: fileKey,
    },
    headers: await headers(),
  });

  const avatarUrl = getPublicUrl(fileKey);

  return {
    avatarUrl,
    size: optimizedImage.size,
  };
}

export { updateAvatar };

export type { UpdateAvatarInput, UpdateAvatarResult };
