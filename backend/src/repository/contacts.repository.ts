import { IContactsStore } from "../data-store/contacts-store.model";
import { Contact } from "../shared/contacts.types";

/**
 * Repository wrapper around the underlying data store for contact operations.
 *
 * This class delegates calls to an IContactsStore implementation and exposes
 * simple async methods used by higher-level services/controllers.
 */
export class ContactsRepository {
  /**
   * Create a new repository instance.
   *
   * @param store - concrete implementation of IContactsStore used for data access
   */
  constructor(private store: IContactsStore) {}

  /**
   * Retrieve all contacts from the store.
   *
   * @returns Promise resolving to an array of contacts
   */
  async getAllContacts() {
    const result = await this.store.getAllContacts();
    return result;
  }

  /**
   * Get a single contact by its identifier.
   *
   * @param id - contact identifier
   * @returns Promise resolving to the contact or null if not found
   */
  async getContactById(id: string) {
    const contact = await this.store.getContactById(id);
    return contact;
  }

  /**
   * Save a new contact to the store.
   * @param contact - contact data to save
   * @returns Promise resolving to the saved contact with any generated fields (e.g., id)
   */
  async saveContact(contact: Contact) {
    const savedContact = await this.store.saveContact(contact);
    return savedContact;
  }
}
