import express from "express";
import {
  getAllContacts,
  getContactById,
  saveContact,
} from "../../../controllers";

const contactsRouter = express.Router({ mergeParams: true });

contactsRouter.get("/contacts", getAllContacts);
contactsRouter.get("/contacts/:id", getContactById);
contactsRouter.post("/contacts", saveContact);

export { contactsRouter };
