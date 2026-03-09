import { NextResponse } from "next/server";

import { createPortalSession } from "@/features/billing/services/stripe/create-portal-session.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    await checkRatelimit(authenticatedRatelimit, session.user.id);

    const result = await createPortalSession({
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
