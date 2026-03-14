import { Contact, ContactList } from "../shared/contacts.types";

export interface IContactsStore {
  saveContact(contact: Contact): Promise<void>;
  getAllContacts(): Promise<ContactList>;
  getContactById(id: string): Promise<Contact | null>;
}

export interface ContactRawData {
  contactid: string;
  contactname: string;
  contactemail: string;
  contactmessage: string;
  contactsubject: string;
  ipaddress: string;
  useragent: string;
  createdat: string;
}
