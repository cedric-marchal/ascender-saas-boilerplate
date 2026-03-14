import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

async function GET(request: Request) {
  try {
    const authorizationHeader = request.headers.get("authorization");

    if (!env.CRON_SECRET || !authorizationHeader) {
      throw new UnauthorizedError("Non autorisé");
    }

    const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
    const received = Buffer.from(authorizationHeader);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedError("Non autorisé");
    }

    const now = new Date();

    const [deletedSessions, deletedVerifications] = await prisma.$transaction([
      prisma.session.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.verification.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          deletedSessions: deletedSessions.count,
          deletedVerifications: deletedVerifications.count,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { GET };
