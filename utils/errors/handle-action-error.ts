import "server-only";

import { ZodError } from "zod";

import { AppError } from "@/utils/errors/errors";

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

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      type: error.name,
    };
  }

  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Une erreur inattendue s'est produite";

  return {
    success: false,
    error: message,
    type: error instanceof Error ? "ServerError" : "UnknownError",
  };
}

export { handleActionError };

export type { ActionError };
