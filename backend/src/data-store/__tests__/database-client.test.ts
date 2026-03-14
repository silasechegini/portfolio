import { Pool } from "pg";
import { query, getClient, closePool } from "../database-client"; 


jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe("Database Utility", () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = new Pool();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await closePool();
  });

  describe("query()", () => {
    it("should execute a query successfully", async () => {
      const mockResult = { rows: [{ id: 1, name: "Test" }], rowCount: 1 };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const sql = "SELECT * FROM users WHERE id = $1";
      const params = [1];

      const result = await query(sql, params);

      expect(mockPool.query).toHaveBeenCalledWith(sql, params);
      expect(result).toEqual(mockResult);
    });

    it("should throw and log an error when the query fails", async () => {
      const dbError = new Error("Syntax Error");
      mockPool.query.mockRejectedValueOnce(dbError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(query("SELECT * FROM invalid", [])).rejects.toThrow(
        "Syntax Error",
      );
      expect(consoleSpy).toHaveBeenCalledWith("Database query error:", dbError);

      consoleSpy.mockRestore();
    });
  });

  describe("getClient()", () => {
    it("should return a client from the pool", async () => {
      const mockClient = { query: jest.fn(), release: jest.fn() };
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const client = await getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });
  });

  describe("Initialization and Pool Management", () => {
    it("should initialize the pool with correct env variables", async () => {
      await query("SELECT 1");

      expect(Pool).toHaveBeenCalledWith({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: expect.any(Number),
        database: process.env.DB_NAME,
        connectionTimeoutMillis: expect.any(Number),
        idleTimeoutMillis: expect.any(Number),
        max: expect.any(Number),
      });
    });

    it("should close the pool and set it to null", async () => {
      await query("SELECT 1");
      await closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
