import { ContactRawData } from "../..";
import { ContactsStore } from "../contacts-store";
import * as dbClient from "../database-client";

jest.mock("../database-client");

const mockRows: ContactRawData[] = [
  {
    contactid: "1",
    contactname: "John Doe",
    contactemail: "john.doe@example.com",
    contactsubject: "Hello",
    contactmessage: "This is a test message.",
    ipaddress: "127.0.0.1",
    useragent: "Mozilla/5.0",
    createdat: "2024-06-01T00:00:00Z",
  },
  {
    contactid: "2",
    contactname: "Jane Smith",
    contactemail: "jane.smith@example.com",
    contactsubject: "Hi",
    contactmessage: "This is another test message.",
    ipaddress: "127.0.0.1",
    useragent: "Mozilla/5.0",
    createdat: "2024-06-01T00:00:00Z",
  },
];

describe("ContactsStore", () => {
  let store: ContactsStore;

  beforeEach(() => {
    store = new ContactsStore();
    jest.clearAllMocks();
  });

  it("getAllContacts returns mapped contacts", async () => {
    (dbClient.query as jest.Mock).mockResolvedValue({ rows: mockRows });
    const result = await store.getAllContacts();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      subject: "Hello",
      message: "This is a test message.",
    });
    expect(result[1]).toMatchObject({
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      subject: "Hi",
      message: "This is another test message.",
    });
  });

  it("getContactById returns single contact", async () => {
    (dbClient.query as jest.Mock).mockResolvedValue({ rows: [mockRows[0]] });
    const result = await store.getContactById("1");

    expect(dbClient.query).toHaveBeenCalledWith(
      "SELECT * FROM contacts WHERE contactId = $1;",
      ["1"],
    );

    expect(result).toMatchObject({
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      subject: "Hello",
      message: "This is a test message.",
    });
  });

  it("getContactById returns null if not found", async () => {
    (dbClient.query as jest.Mock).mockResolvedValue({ rows: [] });
    const result = await store.getContactById("999");
    expect(result).toBeNull();
  });

  it("saveContact uses parameterized insert", async () => {
    (dbClient.query as jest.Mock).mockResolvedValue({ rows: [] });

    await store.saveContact({
      id: "id-1",
      name: "John",
      email: "john@example.com",
      subject: "Hi",
      message: "Message",
    });

    expect(dbClient.query).toHaveBeenCalledWith(
      "INSERT INTO contacts (contactId, contactName, contactEmail, contactSubject, contactMessage) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      ["id-1", "John", "john@example.com", "Hi", "Message"],
    );
  });
});
