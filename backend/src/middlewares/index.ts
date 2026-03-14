import { Request, Response, NextFunction } from "express";
import { APIError, HTTP_STATUS_CODES } from "../shared";
import { ZodError } from "zod";

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] INFO: ${message}`,
      meta ? JSON.stringify(meta) : "",
    );
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] ERROR: ${message}`,
      error,
      meta ? JSON.stringify(meta) : "",
    );
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] WARN: ${message}`,
      meta ? JSON.stringify(meta) : "",
    );
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") {
      const timestamp = new Date().toISOString();
      console.debug(
        `[${timestamp}] DEBUG: ${message}`,
        meta ? JSON.stringify(meta) : "",
      );
    }
  },
};

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);

  // Capture response
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
      {
        type: "response",
        statusCode: res.statusCode,
        duration,
      },
    );
  });

  next();
};

const errorHandlingMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode: number = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message: string = "Internal Server Error";

  if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    message = `Validation Error: ${err.issues
      .map((e) => e.message)
      .join("; ")}`;
  } else if (err instanceof Error) {
    statusCode = err.message.includes("not found")
      ? HTTP_STATUS_CODES.NOT_FOUND
      : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    message = err.message;
  } else {
    logger.error("UNEXPECTED SERVER ERROR:", err);

    // to avoid leaking sensitive stack trace details in production
    if (process.env.NODE_ENV === "production") {
      message = "A server error occurred.";
    } else {
      message = typeof err === "string" ? err : JSON.stringify(err);
    }
  }

  logger.error(message, err, { statusCode, path: req.path });

  res.status(statusCode).json({
    message,
    status: statusCode,
    timeStamp: new Date().toISOString(),
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : err instanceof Error
          ? err.stack
          : undefined,
  });
};

const routeNotFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
    error: {
      type: "NotFound",
      message: `The requested resource: ${req.originalUrl}, could not be found.`,
    },
    status: HTTP_STATUS_CODES.NOT_FOUND,
    timeStamp: new Date().toISOString(),
  });
};

export {
  errorHandlingMiddleware,
  loggerMiddleware,
  routeNotFoundMiddleware,
  logger,
};
