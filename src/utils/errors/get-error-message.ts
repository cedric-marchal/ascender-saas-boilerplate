import { isResponseError } from "up-fetch";

const DEFAULT_ERROR_MESSAGE = "Une erreur est survenue";

function hasStringMessage(value: unknown): value is { message: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "message" in value &&
    typeof (value as Record<string, unknown>).message === "string"
  );
}

function getErrorMessage(error: unknown): string {
  if (isResponseError(error) && hasStringMessage(error.data)) {
    return error.data.message;
  }

  if (!isResponseError(error) && error instanceof Error) {
    return error.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}

export { getErrorMessage };
