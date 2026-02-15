import { isResponseError } from "up-fetch";

const DEFAULT_ERROR_MESSAGE = "Une erreur est survenue";

function getErrorMessage(error: unknown): string {
  if (isResponseError(error)) {
    const body = error.data as { message?: string };

    if (body?.message) {
      return body.message;
    }

    return DEFAULT_ERROR_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}

export { getErrorMessage };
