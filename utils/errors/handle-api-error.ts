import "server-only";

import { NextResponse } from "next/server";

import { ZodError } from "zod";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from "@/utils/errors/errors";

function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "ValidationError",
        message:
          error.issues[0]?.message ?? "Une erreur de validation s'est produite",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof BadRequestError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "BadRequestError",
        message: error.message,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof UnauthorizedError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "UnauthorizedError",
        message: error.message,
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ForbiddenError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "ForbiddenError",
        message: error.message,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof NotFoundError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "NotFoundError",
        message: error.message,
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ConflictError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "ConflictError",
        message: error.message,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof PayloadTooLargeError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "PayloadTooLargeError",
        message: error.message,
      }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof UnsupportedMediaTypeError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "UnsupportedMediaTypeError",
        message: error.message,
      }),
      { status: 415, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof UnprocessableEntityError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "UnprocessableEntityError",
        message: error.message,
      }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof TooManyRequestsError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "TooManyRequestsError",
        message: error.message,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ServiceUnavailableError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "ServiceUnavailableError",
        message: error.message,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof Error) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "ServerError",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Une erreur inattendue s'est produite",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new NextResponse(
    JSON.stringify({
      success: false,
      type: "UnknownError",
      message: "Une erreur inattendue s'est produite",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

export { handleApiError };
