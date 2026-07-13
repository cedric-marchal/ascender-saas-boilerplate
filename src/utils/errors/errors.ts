import "server-only";

/**
 * `message` is either a literal user-facing string (e.g. re-thrown from a
 * dependency that already localizes it, like Better Auth's own `APIError`)
 * or a translation key from the `errors.*` namespace in `messages/*.json`
 * (by convention, prefixed with `"errors."`). `translateAppError` (see
 * `@/utils/errors/translate-app-error`) resolves the key using `params` for
 * ICU interpolation; literal messages are returned as-is.
 */
type AppErrorOptions = ErrorOptions & {
  params?: Record<string, string | number>;
};

class AppError extends Error {
  readonly statusCode: number;
  readonly params?: Record<string, string | number>;

  constructor(message: string, statusCode: number, options?: AppErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.params = options?.params;
  }
}

class BadRequestError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 400, options);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 401, options);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 403, options);
  }
}

class NotFoundError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 404, options);
  }
}

class ConflictError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 409, options);
  }
}

class PayloadTooLargeError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 413, options);
  }
}

class UnsupportedMediaTypeError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 415, options);
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 422, options);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 429, options);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, 503, options);
  }
}

export {
  AppError,
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
};

export type { AppErrorOptions };
