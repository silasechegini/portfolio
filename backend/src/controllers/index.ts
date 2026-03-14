import { ContactsController } from "./contacts";
import { contactsRepository } from "../repository";
import { ContactsValidators } from "../validation";
const validator = new ContactsValidators();
export const { getAllContacts, getContactById, saveContact } =
  new ContactsController(contactsRepository, validator);
