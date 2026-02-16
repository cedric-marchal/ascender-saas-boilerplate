const DEFAULT_ERROR_MESSAGE = "Une erreur est survenue";

type ActionResult<TData = unknown> =
  | {
      serverError?: string;
      data?: TData;
    }
  | undefined;

function getActionResult<TData>(result: ActionResult<TData>): TData {
  if (!result) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  if (result.serverError) {
    throw new Error(result.serverError);
  }

  if (!result.data) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  return result.data;
}

export { getActionResult };
