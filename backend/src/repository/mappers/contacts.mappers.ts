import { Contact } from "../../shared";

export const mapToDTO = (rawContact: Contact) => {
  return {
    id: rawContact.id,
    name: rawContact.name,
    email: rawContact.email,
    subject: rawContact.subject,
    message: rawContact.message,
    ipAddress: rawContact.ipAddress,
    userAgent: rawContact.userAgent,
    createdAt: rawContact.createdAt,
  };
};
