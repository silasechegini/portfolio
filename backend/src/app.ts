import express from "express";
import cors from "cors";
import { contactsRouter, createHealthRouter } from "./routes";
import {
  errorHandlingMiddleware,
  loggerMiddleware,
  routeNotFoundMiddleware,
} from "./middlewares";
import { contactsStore } from "./data-store/contacts-store-factory";

export function createApp() {
  const app = express();
  const healthRouter = createHealthRouter(contactsStore);

  const allowedOrigins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowAllOrigins = allowedOrigins.includes("*");
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server / health-check requests without browser origin.
        if (!origin) {
          return callback(null, true);
        }

        if (allowAllOrigins || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
      },
    }),
  );

  app.use(loggerMiddleware);
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("portfolio API is running!");
  });

  app.use(healthRouter);
  app.use("/api/v1", contactsRouter);
  app.use(routeNotFoundMiddleware);
  app.use(errorHandlingMiddleware);

  return app;
}
