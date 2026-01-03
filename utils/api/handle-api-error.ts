import { NextResponse } from "next/server";
import { ZodError } from "zod";

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

class TooManyRequestsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TooManyRequestsError";
  }
}

class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

function handleApiError(error: unknown): NextResponse {
  // 400 Bad Request
  if (error instanceof ZodError) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        type: "ValidationError",
        message: error.message || "Validation error",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 400 Bad Request
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

  // 401 Unauthorized
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

  // 403 Forbidden
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

  // 404 Not Found
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

  // 409 Conflict
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

  // 429 Too Many Requests
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

  // 500 Server Error
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

  // 500 Server Error
  return new NextResponse(
    JSON.stringify({
      success: false,
      type: "UnknownError",
      message: "Une erreur inattendue s'est produite",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

export {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  BadRequestError,
  handleApiError,
};
