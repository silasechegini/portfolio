import { API_ERROR_TYPES, HTTP_STATUS_CODES } from "./apiError.types";

/**
 * Generic API Error class used across the application to represent HTTP-related errors.
 *
 * Extends the built-in Error and includes a numeric HTTP status code and an
 * error name from API_ERROR_TYPES.
 */
class APIError extends Error {
  /**
   * Numeric HTTP status code associated with this error.
   */
  statusCode: HTTP_STATUS_CODES;

  /**
   * Create a new APIError.
   *
   * @param message - error message.
   * @param name - error type (one of API_ERROR_TYPES).
   * @param statusCode - Optional HTTP status code. Defaults to 500 (INTERNAL_SERVER_ERROR).
   */
  constructor(
    message: string,
    name: API_ERROR_TYPES,
    statusCode: HTTP_STATUS_CODES = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
  }
}
export { APIError };
