import { NextResponse } from "next/server";

import { UpdateAvatarSchema } from "@/features/account/schemas/avatar.schema";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

import { updateAvatar } from "@/features/account/services/update-avatar.service";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

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

    const result = await updateAvatar({
      userId: session.user.id,
      avatar: data.avatar,
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
