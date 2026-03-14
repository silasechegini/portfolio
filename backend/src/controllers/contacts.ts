/**
 * Contacts controller module.
 *
 * Exposes ContactsController which handles HTTP requests related to contacts:
 * - list all contacts
 * - get a contact by id
 * - save a new contact
 *
 * This controller delegates data access to a repository and uses validators for inputs.
 */

import type { Request, Response } from "express";
import type { NextFunction } from "express";
import { randomUUID } from "crypto";
import { IContactsController } from "./models";
import { mapToDTO, ContactsRepository } from "../repository";
import {
  API_ERROR_TYPES,
  APIError,
  HTTP_STATUS_CODES,
  Contact,
} from "../shared";
import { ContactsValidators } from "../validation";

/**
 * Controller responsible for handling contact-related HTTP requests.
 *
 * @remarks
 * This class expects a repository implementing contact data access and a set
 * of validators. Methods write responses using the provided Express Response
 * object or delegate errors to next().
 */
export class ContactsController implements IContactsController {
  /**
   * Create a ContactsController.
   *
   * @param repository - repository providing contact data access methods
   */
  constructor(
    private repository: ContactsRepository,
    private validator: ContactsValidators,
  ) {}

  /**
   * Return all contacts as JSON.
   *
   * Responds with { data, status, count } and HTTP 200 on success.
   *
   * @param req - Express request (unused)
   * @param res - Express response used to send the result
   * @param next - Express next function for error handling
   */
  getAllContacts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined> => {
    try {
      const contactsList = await this.repository.getAllContacts();
      const contactsListDTO = contactsList.map((contact) => mapToDTO(contact));
      return res.status(HTTP_STATUS_CODES.OK).json({
        data: contactsList,
        status: HTTP_STATUS_CODES.OK,
        count: contactsListDTO.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single contact by id.
   *
   * If overlay/parcel/building query params are present this may stream an
   * image response via displayPropertyTile; otherwise returns JSON with the
   * contact data. Throws an APIError with NOT_FOUND if the contact is missing.
   *
   * @param req - Express request with params.id and optional query flags
   * @param res - Express response used for JSON or image streaming
   * @param next - Express next function for error handling
   */
  getContactById = async (
    req: Request<{ id: string }, any, any, Contact>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined> => {
    try {
      const { id } = req.params;

      const contact = await this.repository.getContactById(id);

      if (!contact) {
        throw new APIError(
          `Contact with id: ${id} not found`,
          API_ERROR_TYPES.CONTACT_NOT_FOUND_ERROR,
          HTTP_STATUS_CODES.NOT_FOUND,
        );
      }

      const contactDTO = mapToDTO(contact);

      // Otherwise, send JSON
      return res.status(HTTP_STATUS_CODES.OK).json({
        data: contactDTO,
        status: HTTP_STATUS_CODES.OK,
      });
    } catch (error) {
      next(error);
    }
  };

  saveContact = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined> => {
    try {
      const { name, email, message, subject } =
        await this.validator.validateSaveContactRequest(req.body);

      const normalizedName = typeof name === "string" ? name.trim() : "";
      const normalizedEmail = typeof email === "string" ? email.trim() : "";
      const normalizedMessage =
        typeof message === "string" ? message.trim() : "";
      const normalizedSubject =
        typeof subject === "string" ? subject.trim() : "";

      if (!normalizedName || !normalizedEmail || !normalizedMessage) {
        throw new APIError(
          "Missing required fields: name, email, message",
          API_ERROR_TYPES.VALIDATION_ERROR,
          HTTP_STATUS_CODES.BAD_REQUEST,
        );
      }

      const newContact: Contact = {
        id: randomUUID(),
        name: normalizedName,
        email: normalizedEmail,
        message: normalizedMessage,
        subject: normalizedSubject,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "Unknown",
      };
      await this.repository.saveContact(newContact);
      const contactDTO = mapToDTO(newContact);

      return res.status(HTTP_STATUS_CODES.CREATED).json({
        data: contactDTO,
        status: HTTP_STATUS_CODES.CREATED,
      });
    } catch (error) {
      const dbError = error as { code?: string };
      if (dbError.code === "23505") {
        next(
          new APIError(
            "A contact with this identifier already exists",
            API_ERROR_TYPES.VALIDATION_ERROR,
            HTTP_STATUS_CODES.CONFLICT,
          ),
        );
        return;
      }

      next(error);
    }
  };
}
