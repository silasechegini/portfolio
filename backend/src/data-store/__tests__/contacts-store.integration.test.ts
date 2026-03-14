/**
 * Integration test – ContactsStore against a real PostgreSQL database.
 *
 * Prerequisites
 * -------------
 * To run this test, execute the following command from the project root:
 * Start the isolated test database (does NOT affect the dev stack):
 *
 * cd backend
 * docker-compose -f docker-compose-test.yml up -d // Start the test database (leaves the dev stack untouched)
 * npx jest contacts-store.integration --testPathPatterns=integration
 *
 * Tear down the test container when done
 * docker-compose -f docker-compose-test.yml down
 * 
 * ONE LINE COMMAND TO RUN TESTS:
 * PowerShell (from backend/ directory):
 * .\run-integration-tests.ps1
 *
 * What this suite does
 * --------------------
 * 1. beforeAll  – creates a dedicated `portfolio_integration_test` database,
 *                 applies the real schema from database/01-setup.sql, and seeds
 *                 two dummy contacts via ContactsStore.saveContact().
 * 2. Tests      – exercise getAllContacts(), getContactById(), and saveContact()
 *                 against the live database with no mocking whatsoever.
 * 3. afterAll   – closes the store pool, terminates any remaining connections,
 *                 and drops the test database, leaving the environment clean.
 */

import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";
import { ContactsStore } from "../contacts-store";
import { closePool } from "../database-client";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TEST_DB = "portfolio_integration_test";

/** Connection to the PostgreSQL maintenance database used to create / drop
 *  the integration-test database itself. */
const ADMIN_CONFIG = {
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "engineTest888",
  database: "postgres", // maintenance DB – always exists
};

// ---------------------------------------------------------------------------
// Fixed-UUID dummy contacts (deterministic so assertions are precise)
// ---------------------------------------------------------------------------

const DUMMY_CONTACTS = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
    name: "Alice Tester",
    email: "alice@integration.test",
    subject: "Hello Integration",
    message: "Alice's integration test message.",
    ipAddress: "10.0.0.1",
    userAgent: "Jest/Integration",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678902",
    name: "Bob Tester",
    email: "bob@integration.test",
    subject: "Second Contact",
    message: "Bob's integration test message.",
    ipAddress: "10.0.0.2",
    userAgent: "Jest/Integration",
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Terminate all connections to a named database so that DROP DATABASE can
 *  proceed without the "other users are using the database" error. */
async function terminateConnections(
  adminPool: Pool,
  dbName: string,
): Promise<void> {
  await adminPool.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1
       AND pid <> pg_backend_pid()`,
    [dbName],
  );
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("ContactsStore – Integration (real PostgreSQL)", () => {
  let adminPool: Pool;
  let store: ContactsStore;

  // -------------------------------------------------------------------------
  // Setup: create test database → apply schema → seed data
  // -------------------------------------------------------------------------

  beforeAll(async () => {
    adminPool = new Pool(ADMIN_CONFIG);

    // --- 1. Create a clean test database -----------------------------------
    await terminateConnections(adminPool, TEST_DB);
    await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB}"`);
    await adminPool.query(`CREATE DATABASE "${TEST_DB}"`);

    // --- 2. Apply the real schema ------------------------------------------
    const schemaPool = new Pool({ ...ADMIN_CONFIG, database: TEST_DB });
    try {
      const setupSql = fs.readFileSync(
        path.resolve(__dirname, "../../../database/contacts.sql"),
        "utf-8",
      );
      // pg supports multiple DDL statements in a single query() call.
      await schemaPool.query(setupSql);
    } finally {
      await schemaPool.end();
    }

    // --- 3. Wire database-client to the test database ----------------------
    // The pool in database-client.ts is lazy: it is created on the first call
    // to query(), reading process.env at that moment.  Setting env vars here
    // (before any ContactsStore method is invoked) is sufficient.
    process.env.DB_HOST = ADMIN_CONFIG.host;
    process.env.DB_PORT = String(ADMIN_CONFIG.port);
    process.env.DB_USER = ADMIN_CONFIG.user;
    process.env.DB_PASSWORD = ADMIN_CONFIG.password;
    process.env.DB_NAME = TEST_DB;

    // --- 4. Seed dummy data ------------------------------------------------
    store = new ContactsStore();
    for (const contact of DUMMY_CONTACTS) {
      await store.saveContact(contact);
    }
  }, 30_000 /* ms – allow time for Docker DB round-trips */);

  // -------------------------------------------------------------------------
  // Teardown: close store pool → drop test database
  // -------------------------------------------------------------------------

  afterAll(async () => {
    // Release all connections held by database-client's pool.
    await closePool();

    // Terminate any stray connections then drop the test database.
    await terminateConnections(adminPool, TEST_DB);
    await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB}"`);
    await adminPool.end();
  }, 10_000);

  // -------------------------------------------------------------------------
  // getAllContacts()
  // -------------------------------------------------------------------------

  describe("getAllContacts()", () => {
    it("returns all seeded contacts", async () => {
      const contacts = await store.getAllContacts();

      expect(contacts).toHaveLength(2);
    });

    it("contains both seeded contact IDs", async () => {
      const contacts = await store.getAllContacts();
      const ids = contacts.map((c) => c.id);

      expect(ids).toContain(DUMMY_CONTACTS[0].id);
      expect(ids).toContain(DUMMY_CONTACTS[1].id);
    });

    it("maps all fields correctly for Alice", async () => {
      const contacts = await store.getAllContacts();
      const alice = contacts.find((c) => c.id === DUMMY_CONTACTS[0].id);

      expect(alice).toBeDefined();
      expect(alice!.name).toBe("Alice Tester");
      expect(alice!.email).toBe("alice@integration.test");
      expect(alice!.subject).toBe("Hello Integration");
      expect(alice!.message).toBe("Alice's integration test message.");
      expect(alice!.ipAddress).toBe("10.0.0.1");
      expect(alice!.userAgent).toBe("Jest/Integration");
      expect(alice!.createdAt).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // getContactById()
  // -------------------------------------------------------------------------

  describe("getContactById()", () => {
    it("returns the correct contact for a known ID", async () => {
      const contact = await store.getContactById(DUMMY_CONTACTS[1].id);

      expect(contact).not.toBeNull();
      expect(contact!.id).toBe(DUMMY_CONTACTS[1].id);
      expect(contact!.name).toBe("Bob Tester");
      expect(contact!.email).toBe("bob@integration.test");
      expect(contact!.subject).toBe("Second Contact");
      expect(contact!.message).toBe("Bob's integration test message.");
      expect(contact!.ipAddress).toBe("10.0.0.2");
      expect(contact!.userAgent).toBe("Jest/Integration");
    });

    it("returns null for a non-existent ID", async () => {
      const contact = await store.getContactById(
        "00000000-0000-0000-0000-000000000000",
      );

      expect(contact).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // saveContact()
  // -------------------------------------------------------------------------

  describe("saveContact()", () => {
    const newContact = {
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      name: "Charlie New",
      email: "charlie@integration.test",
      subject: "Fresh Entry",
      message: "A new contact added mid-test.",
      ipAddress: "192.168.1.1",
      userAgent: "Jest/SaveTest",
    };

    it("persists a new contact that is then retrievable by ID", async () => {
      await store.saveContact(newContact);

      const found = await store.getContactById(newContact.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(newContact.id);
      expect(found!.name).toBe("Charlie New");
      expect(found!.email).toBe("charlie@integration.test");
      expect(found!.subject).toBe("Fresh Entry");
      expect(found!.message).toBe("A new contact added mid-test.");
      expect(found!.ipAddress).toBe("192.168.1.1");
      expect(found!.userAgent).toBe("Jest/SaveTest");
    });

    it("increases the total contact count after save", async () => {
      // At this point: 2 seeded + 1 saved above = 3
      const all = await store.getAllContacts();

      expect(all).toHaveLength(3);
    });

    it("does not alter the two originally seeded contacts", async () => {
      const all = await store.getAllContacts();
      const ids = all.map((c) => c.id);

      expect(ids).toContain(DUMMY_CONTACTS[0].id);
      expect(ids).toContain(DUMMY_CONTACTS[1].id);
    });
  });
});
