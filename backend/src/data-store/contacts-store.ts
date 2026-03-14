/**
 * Data store adapter for contacts.
 *
 * Provides implementations for loading contacts from the underlying database
 * client and mapping raw rows into the application's Contact shapes.
 *
 * The file exposes:
 * - parseImageBounds: helper to normalize image bounds from DB formats
 * - ContactsStore: IContactsStore implementation delegating to `query`
 */
import { Contact, ContactList } from "../shared/contacts.types";
import { query } from "./database-client";
import { IContactsStore, ContactRawData } from "./contacts-store.model";

/**
 * Concrete implementation of IContactsStore that queries the database.
 *
 * Delegates to the shared `query` helper and maps raw rows into Contact shapes
 * expected by the rest of the application.
 */
export class ContactsStore implements IContactsStore {
  async saveContact(contact: Contact): Promise<void> {
    const queryString =
      "INSERT INTO contacts (contactId, contactName, contactEmail, contactSubject, contactMessage, ipAddress, userAgent) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;";
    await query<Contact>(queryString, [
      contact.id,
      contact.name,
      contact.email,
      contact.subject,
      contact.message,
      contact.ipAddress,
      contact.userAgent,
    ]);
  }
  /**
   * Retrieve all contacts from the database.
   *
   * @returns Promise resolving to a list of Contact objects
   */
  async getAllContacts(): Promise<ContactList> {
    const queryString = "SELECT * FROM contacts;";
    const result = await query<ContactRawData>(queryString);
    // Map DB rows to Contact interface
    const contacts = result.rows.map((row) => ({
      id: row.contactid,
      name: row.contactname,
      email: row.contactemail,
      subject: row.contactsubject,
      message: row.contactmessage,
      ipAddress: row.ipaddress,
      userAgent: row.useragent,
      createdAt: row.createdat,
    }));

    return contacts;
  }

  /**
   * Get a single contact by its id.
   *
   * @param id - contact identifier
   * @returns Promise resolving to Contact or null if not found
   */
  async getContactById(id: string): Promise<Contact | null> {
    const queryString = "SELECT * FROM contacts WHERE contactId = $1;";
    const result = await query<ContactRawData>(queryString, [id]);
    // Map DB rows to Contact interface
    const contacts = result.rows.map((row) => ({
      id: row.contactid,
      name: row.contactname,
      email: row.contactemail,
      subject: row.contactsubject,
      message: row.contactmessage,
      ipAddress: row.ipaddress,
      userAgent: row.useragent,
      createdAt: row.createdat,
    }));

    return contacts[0] || null;
  }
}
