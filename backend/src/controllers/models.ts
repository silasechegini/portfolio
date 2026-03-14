import type { Request, Response } from "express";
import type { NextFunction } from "express";

export interface IContactsController {
  saveContact(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined>;
  getAllContacts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined>;
  getContactById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined>;
}
