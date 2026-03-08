import "server-only";

class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class BadRequestError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 400, options);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 401, options);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 403, options);
  }
}

class NotFoundError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 404, options);
  }
}

class ConflictError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 409, options);
  }
}

class PayloadTooLargeError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 413, options);
  }
}

class UnsupportedMediaTypeError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 415, options);
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 422, options);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 429, options);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
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
