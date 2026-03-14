import { Router, Request, Response } from "express";
import { IContactsStore } from "../data-store";

export function createHealthRouter(contactsStore: IContactsStore) {
  const router = Router();

  // Basic health check - just confirms the app is running
  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: "portfolio-api",
    });
  });

  // Readiness check - confirms app is ready to handle requests
  router.get("/ready", async (_req: Request, res: Response) => {
    try {
      // Check if data store is accessible
      const contacts = await contactsStore.getAllContacts();
      const isReady = contacts !== null;

      if (isReady) {
        res.status(200).json({
          status: "READY",
          timestamp: new Date().toISOString(),
          checks: {
            dataStore: "OK",
            contactsCount: contacts.length,
          },
        });
      } else {
        res.status(503).json({
          status: "NOT_READY",
          timestamp: new Date().toISOString(),
          checks: {
            dataStore: "FAILED",
          },
        });
      }
    } catch (error) {
      res.status(503).json({
        status: "NOT_READY",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Liveness check - confirms the app hasn't deadlocked
  router.get("/live", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ALIVE",
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
