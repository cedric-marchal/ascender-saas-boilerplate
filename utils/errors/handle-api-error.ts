import "server-only";

import { NextResponse } from "next/server";

import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";

import { AppError } from "@/utils/errors/errors";

function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        type: "ValidationError",
        message:
          error.issues[0]?.message ?? "Une erreur de validation s'est produite",
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        type: error.name,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  Sentry.captureException(error);

  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Une erreur inattendue s'est produite";

  return NextResponse.json(
    {
      success: false,
      type: "ServerError",
      message,
    },
    { status: 500 },
  );
}

export { handleApiError };
