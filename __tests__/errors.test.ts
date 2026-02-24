import { describe, expect, it, vi } from "vitest";

import {
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
} from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

describe("AppError base class", () => {
  it("sets message and statusCode", () => {
    const error = new AppError("test message", 418);
    expect(error.message).toBe("test message");
    expect(error.statusCode).toBe(418);
    expect(error.name).toBe("AppError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("Error classes", () => {
  const cases: [string, new (message: string) => AppError, number][] = [
    ["BadRequestError", BadRequestError, 400],
    ["UnauthorizedError", UnauthorizedError, 401],
    ["ForbiddenError", ForbiddenError, 403],
    ["NotFoundError", NotFoundError, 404],
    ["ConflictError", ConflictError, 409],
    ["PayloadTooLargeError", PayloadTooLargeError, 413],
    ["UnsupportedMediaTypeError", UnsupportedMediaTypeError, 415],
    ["UnprocessableEntityError", UnprocessableEntityError, 422],
    ["TooManyRequestsError", TooManyRequestsError, 429],
    ["ServiceUnavailableError", ServiceUnavailableError, 503],
  ];

  it.each(cases)(
    "%s has statusCode %i and extends AppError",
    (
      name: string,
      ErrorClass: new (message: string) => AppError,
      statusCode: number,
    ) => {
      const error = new ErrorClass("test");
      expect(error.statusCode).toBe(statusCode);
      expect(error.name).toBe(name);
      expect(error.message).toBe("test");
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    },
  );
});
