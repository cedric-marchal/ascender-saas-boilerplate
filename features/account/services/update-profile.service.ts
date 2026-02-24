import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

import { BadRequestError, ConflictError } from "@/utils/errors/errors";

type UpdateProfileInput = {
  userId: string;
  name: string;
  email: string;
};

type UpdateProfileResult = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  emailChanged: boolean;
};

async function updateProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const currentUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!currentUser) {
    throw new BadRequestError("Utilisateur introuvable");
  }

  const emailChanged = currentUser.email !== input.email;
  const nameChanged = currentUser.name !== input.name;

  if (emailChanged) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Cette adresse email est déjà utilisée");
    }
  }

  if (nameChanged && !emailChanged) {
    await auth.api.updateUser({
      body: {
        name: input.name,
      },
      headers: await headers(),
    });

    revalidatePath("/dashboard/parametres");

    return {
      user: {
        id: currentUser.id,
        name: input.name,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
      },
      emailChanged: false,
    };
  }

  if (emailChanged) {
    if (nameChanged) {
      await auth.api.updateUser({
        body: {
          name: input.name,
        },
        headers: await headers(),
      });
    }

    await auth.api.changeEmail({
      body: {
        newEmail: input.email,
        callbackURL: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/parametres`,
      },
      headers: await headers(),
    });

    revalidatePath("/dashboard/parametres");

    return {
      user: {
        id: currentUser.id,
        name: nameChanged ? input.name : currentUser.name,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
      },
      emailChanged: true,
    };
  }

  return {
    user: currentUser,
    emailChanged: false,
  };
}

export { updateProfile };

export type { UpdateProfileInput, UpdateProfileResult };
