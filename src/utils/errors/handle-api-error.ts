import "server-only";

import { NextResponse } from "next/server";

import { getLocaleFromCookies } from "@/i18n/get-locale-from-cookies";
import { getTranslator } from "@/i18n/get-translator";
import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { captureException } from "@/lib/observability";

import { AppError } from "@/utils/errors/errors";
import { translateAppError } from "@/utils/errors/translate-app-error";

async function handleApiError(error: unknown): Promise<NextResponse> {
  const locale = await getLocaleFromCookies();
  const translate = getTranslator(locale);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        type: "ValidationError",
        message:
          error.issues[0]?.message ??
          translate("errors.common.validationError"),
      },
      {
        status: 400,
      },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        type: error.name,
        message: translateAppError(error, locale),
      },
      {
        status: error.statusCode,
      },
    );
  }

  logger.error("Unexpected API error", {
    message: error instanceof Error ? error.message : String(error),
  });
  captureException(error);

  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : translate("errors.common.unexpectedApiError");

  return NextResponse.json(
    {
      success: false,
      type: "ServerError",
      message,
    },
    {
      status: 500,
    },
  );
}

export { handleApiError };
