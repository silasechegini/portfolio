import { ContactsStore } from "../data-store";
import { ContactsRepository } from "./contacts.repository";
export * from "./contacts.repository";
export * from "./mappers/contacts.mappers";

export const contactsRepository = new ContactsRepository(new ContactsStore());
