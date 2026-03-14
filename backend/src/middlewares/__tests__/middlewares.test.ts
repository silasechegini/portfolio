import { Request, Response, NextFunction } from "express";
import {
  errorHandlingMiddleware,
  loggerMiddleware,
  routeNotFoundMiddleware,
  logger,
} from "../index";
import { API_ERROR_TYPES, APIError, HTTP_STATUS_CODES } from "../../shared";
import { ZodError } from "zod";

describe("loggerMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = { method: "GET", path: "/test", originalUrl: "/test" };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn(function (this: any, event, cb) {
        cb();
        return this;
      }),
      statusCode: 200,
    };
    mockNext = jest.fn();
    infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it("logs request and response", () => {
    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("GET /test"));
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("GET /test - 200"),
      expect.objectContaining({ statusCode: 200 }),
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it("attaches response finish listener", () => {
    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.on).toHaveBeenCalledWith(
      "finish",
      expect.any(Function),
    );
  });
});

describe("errorHandlingMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = { path: "/err" };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("handles APIError", () => {
    const err = new APIError(
      "fail",
      API_ERROR_TYPES.INVALID_ID_ERROR,
      HTTP_STATUS_CODES.BAD_REQUEST,
    );
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.BAD_REQUEST,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "fail", status: 400 }),
    );
  });

  it("handles ZodError", () => {
    const err = new ZodError([
      { message: "Invalid", path: [], code: "custom" },
    ]);
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.BAD_REQUEST,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Validation Error"),
        status: 400,
      }),
    );
  });

  it("handles generic Error with 'not found'", () => {
    const err = new Error("Resource not found");
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.NOT_FOUND,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Resource not found", status: 404 }),
    );
  });

  it("handles generic Error as internal server error", () => {
    const err = new Error("Something went wrong");
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Something went wrong",
        status: 500,
      }),
    );
  });

  it("includes stack trace in non-production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const err = new Error("Test error");
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ stack: expect.any(String) }),
    );
    process.env.NODE_ENV = originalEnv;
  });

  it("hides stack trace in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const err = new Error("Test error");
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
    expect(jsonCall.stack).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });

  it("handles unknown error object", () => {
    const err = { foo: "bar" } as any;
    errorHandlingMiddleware(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.anything(), status: 500 }),
    );
  });
});

describe("routeNotFoundMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = { originalUrl: "/missing" };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("returns 404 for unknown route", () => {
    routeNotFoundMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.NOT_FOUND,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          type: "NotFound",
          message: expect.stringContaining("/missing"),
        }),
        status: 404,
        timeStamp: expect.any(String),
      }),
    );
  });

  it("includes the requested URL in error message", () => {
    mockRequest.originalUrl = "/api/v1/unknown";
    routeNotFoundMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
    expect(jsonCall.error.message).toContain("/api/v1/unknown");
  });

  it("includes timestamp in response", () => {
    routeNotFoundMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
    expect(jsonCall.timeStamp).toBeDefined();
    expect(new Date(jsonCall.timeStamp).toString()).not.toBe("Invalid Date");
  });
});
