import "server-only";

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

type ActionError = {
  success: false;
  error: string;
  type: string;
};

function handleActionError(error: unknown): ActionError {
  if (error instanceof ZodError) {
    return {
      success: false,
      error:
        error.issues[0]?.message ?? "Une erreur de validation s'est produite",
      type: "ValidationError",
    };
  }

  if (error instanceof BadRequestError) {
    return {
      success: false,
      error: error.message,
      type: "BadRequestError",
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      success: false,
      error: error.message,
      type: "UnauthorizedError",
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      success: false,
      error: error.message,
      type: "ForbiddenError",
    };
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      error: error.message,
      type: "NotFoundError",
    };
  }

  if (error instanceof ConflictError) {
    return {
      success: false,
      error: error.message,
      type: "ConflictError",
    };
  }

  if (error instanceof PayloadTooLargeError) {
    return {
      success: false,
      error: error.message,
      type: "PayloadTooLargeError",
    };
  }

  if (error instanceof UnsupportedMediaTypeError) {
    return {
      success: false,
      error: error.message,
      type: "UnsupportedMediaTypeError",
    };
  }

  if (error instanceof UnprocessableEntityError) {
    return {
      success: false,
      error: error.message,
      type: "UnprocessableEntityError",
    };
  }

  if (error instanceof TooManyRequestsError) {
    return {
      success: false,
      error: error.message,
      type: "TooManyRequestsError",
    };
  }

  if (error instanceof ServiceUnavailableError) {
    return {
      success: false,
      error: error.message,
      type: "ServiceUnavailableError",
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Une erreur inattendue s'est produite",
      type: "ServerError",
    };
  }

  return {
    success: false,
    error: "Une erreur inattendue s'est produite",
    type: "UnknownError",
  };
}

export { handleActionError };
export type { ActionError };
