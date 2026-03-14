import { APIError } from "../apiError";
import { API_ERROR_TYPES, HTTP_STATUS_CODES } from "../apiError.types";

describe("APIError", () => {
  it("should create an APIError with all parameters", () => {
    const error = new APIError(
      "Test error message",
      API_ERROR_TYPES.VALIDATION_ERROR,
      HTTP_STATUS_CODES.BAD_REQUEST,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe("Test error message");
    expect(error.name).toBe(API_ERROR_TYPES.VALIDATION_ERROR);
    expect(error.statusCode).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
  });

  it("should use default status code when not provided", () => {
    const error = new APIError(
      "Server error",
      API_ERROR_TYPES.VALIDATION_ERROR,
    );

    expect(error.statusCode).toBe(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  });

  it("should create error for contact not found", () => {
    const error = new APIError(
      "not found",
      API_ERROR_TYPES.CONTACT_NOT_FOUND_ERROR,
      HTTP_STATUS_CODES.NOT_FOUND,
    );

    expect(error.message).toBe("not found");
    expect(error.name).toBe(API_ERROR_TYPES.CONTACT_NOT_FOUND_ERROR);
    expect(error.statusCode).toBe(404);
  });

  it("should have stack trace", () => {
    const error = new APIError(
      "Test error",
      API_ERROR_TYPES.VALIDATION_ERROR,
      HTTP_STATUS_CODES.BAD_REQUEST,
    );

    expect(error.stack).toBeDefined();
    expect(error.name).toBe(API_ERROR_TYPES.VALIDATION_ERROR);
  });

  it("should be catchable as Error", () => {
    try {
      throw new APIError(
        "Test error",
        API_ERROR_TYPES.VALIDATION_ERROR,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
      if (error instanceof APIError) {
        expect(error.statusCode).toBe(500);
      }
    }
  });
});
