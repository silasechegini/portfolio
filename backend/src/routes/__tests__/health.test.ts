import request from "supertest";
import express from "express";
import { createHealthRouter } from "../health";
import { ContactsStore } from "../../data-store";

describe("Health Check Endpoints", () => {
  let app: express.Application;
  let contactsStore: ContactsStore;
  beforeEach(() => {
    // Create a fresh store for each test
    contactsStore = {
      getAllContacts: jest.fn().mockResolvedValue([]),
      getContactById: jest.fn(),
      saveContact: jest.fn(),
    };
    const healthRouter = createHealthRouter(contactsStore);
    app = express();
    app.use(healthRouter);
  });

  describe("GET /health", () => {
    it("should return 200 with health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty(
        "service",
        "portfolio-api",
      );
      expect(typeof response.body.uptime).toBe("number");
    });

    it("should return ISO timestamp", async () => {
      const response = await request(app).get("/health").expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });
  });

  describe("GET /ready", () => {
    it("should return 200 when data store is accessible", async () => {
      const response = await request(app).get("/ready").expect(200);

      expect(response.body).toHaveProperty("status", "READY");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("checks");
      expect(response.body.checks).toHaveProperty("dataStore", "OK");
      expect(response.body.checks).toHaveProperty("contactsCount", 0);
    });

    it("should return 503 when data store fails", async () => {
      // Mock getContacts to throw an error
      jest.spyOn(contactsStore, "getAllContacts").mockImplementation(() => {
        throw new Error("Data store unavailable");
      });

      const response = await request(app).get("/ready").expect(503);

      expect(response.body).toHaveProperty("status", "NOT_READY");
      expect(response.body).toHaveProperty("error", "Data store unavailable");
    });
  });

  describe("GET /live", () => {
    it("should return 200 with liveness status", async () => {
      const response = await request(app).get("/live").expect(200);

      expect(response.body).toHaveProperty("status", "ALIVE");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should return ISO timestamp", async () => {
      const response = await request(app).get("/live").expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });
  });

  describe("Integration with other routes", () => {
    it("should not interfere with 404 handling", async () => {
      await request(app).get("/nonexistent").expect(404);
    });
  });
});
