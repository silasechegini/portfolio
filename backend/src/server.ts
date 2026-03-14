import dotenv from "dotenv";

dotenv.config();

import { createApp } from "./app";
import { closePool, getClient } from "./data-store";
import { ContactsValidators } from "./validation";
import { logger } from "./middlewares";

async function startServer() {
  try {
    // 1. Validate environment FIRST
    const validator = new ContactsValidators();
    const envVars = await validator.environmentVariablesValidator();
    logger.info(`Starting server on port ${envVars.PORT}`);
    // 2. Test database connection before starting server
    const client = await getClient();
    logger.info("Database connection established");
    // Release back to pool after testing
    client.release();

    const actualPort = Number(envVars.PORT);

    // 3. Start the server only if DB connection succeeded
    const server = createApp().listen(actualPort, "0.0.0.0", () => {
      logger.info(`Server is running on port ${actualPort}`);
    });

    // 4. Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Force exit if graceful shutdown takes too long
      const forceExitTimeout = setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);

      await new Promise<void>((resolve) => {
        server.close(async () => {
          logger.info("HTTP server closed");
          await closePool();
          logger.info("Database pool closed");
          resolve();
        });
      });

      // Clear if graceful shutdown succeeded
      clearTimeout(forceExitTimeout);
      process.exit(0);
    };

    // Handle termination signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", async (error) => {
      logger.error("Uncaught exception:", error);
      await closePool();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", async (reason) => {
      logger.error("Unhandled rejection:", reason);
      await closePool();
      process.exit(1);
    });
  } catch (error) {
    // 5. Close pool if DB connection fails during startup
    logger.error("Failed to start server:", error);
    await closePool();
    process.exit(1);
  }
}

startServer();
