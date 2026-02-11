import "server-only";

class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

class PayloadTooLargeError extends AppError {
  constructor(message: string) {
    super(message, 413);
  }
}

class UnsupportedMediaTypeError extends AppError {
  constructor(message: string) {
    super(message, 415);
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, 429);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 503);
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
