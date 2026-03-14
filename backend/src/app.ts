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
  app.use(cors({ origin: "*" }));
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
