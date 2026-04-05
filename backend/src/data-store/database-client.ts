import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

// Lazy-initialized pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5555"),
      database: process.env.DB_NAME,
      max: 5, // max number of clients in the pool
      idleTimeoutMillis: 30000, // close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
      ssl: { rejectUnauthorized: false }, // Required for Render PostgreSQL
    });

    // Error handling for pool
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }
  return pool;
}

/**
 * Execute a query using the connection pool
 * @param query SQL query string
 * @param params Query parameters
 * @returns Promise with query results
 */
export async function query<T extends QueryResultRow = any>(
  queryText: string,
  params?: any[],
): Promise<QueryResult<T>> {
  try {
    return await getPool().query(queryText, params);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns Promise with a client connection
 */
export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
