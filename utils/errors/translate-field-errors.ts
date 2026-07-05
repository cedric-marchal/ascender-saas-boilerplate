type FieldErrorLike = { message?: string } | undefined;

/**
 * Zod schemas store translation KEYS (e.g. "validation.email.required") as
 * their message instead of literal text, so the same schema works for every
 * locale. This helper resolves those keys to the active locale's text at
 * display time, right before handing the errors to `<FieldError>`.
 *
 * Established in Phase 2 (`features/auth/schemas/`, `features/contact/schemas/`)
 * as the project-wide pattern — reuse it for every other Zod schema.
 */
function translateFieldErrors<TError extends FieldErrorLike>(
  errors: TError[],
  translate: (key: string) => string,
): TError[] {
  return errors.map((error: TError) => {
    if (!error?.message) {
      return error;
    }

    return {
      ...error,
      message: translate(error.message),
    };
  });
}

export { translateFieldErrors };
