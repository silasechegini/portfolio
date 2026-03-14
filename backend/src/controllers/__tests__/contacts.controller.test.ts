import { ContactsController } from "../contacts";
import { HTTP_STATUS_CODES, APIError, Contact } from "../../shared";
import * as mappers from "../../repository/mappers/contacts.mappers";
import { ContactsValidators } from "../../validation";

jest.mock("../../repository/mappers/contacts.mappers");

const mockRepository = {
  getAllContacts: jest.fn(),
  getContactById: jest.fn(),
  saveContact: jest.fn(),
};
const validator = new ContactsValidators();

const mockRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn();
  return res;
};

describe("ContactsController", () => {
  let controller: ContactsController;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    controller = new ContactsController(mockRepository as any, validator);
    res = mockRes();
    next = jest.fn();
    jest.clearAllMocks();

    (mappers.mapToDTO as jest.Mock).mockImplementation((prop: Contact) => ({
      id: prop.id,
      name: prop.name,
      email: prop.email,
      subject: prop.subject,
      message: prop.message,
    }));
  });

  it("getContacts returns all contacts", async () => {
    const mockContacts: Contact[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        subject: "Hello",
        message: "This is a test message",
      },
    ];
    mockRepository.getAllContacts.mockResolvedValue(mockContacts);

    await controller.getAllContacts({} as any, res, next);

    expect(mockRepository.getAllContacts).toHaveBeenCalled();

    if (next.mock.calls.length > 0) {
      console.error("Error passed to next:", next.mock.calls[0][0]);
    }

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.OK);
    expect(res.json).toHaveBeenCalled();
  });

  it("getContactById returns a contact by id", async () => {
    const mockContact: Contact = {
      id: "3",
      name: "Jane Doe",
      email: "jane.doe@ymail.com",
      subject: "hi",
      message: "some message here",
    };
    mockRepository.getContactById.mockResolvedValue(mockContact);

    await controller.getContactById(
      { params: { id: "3" }, query: {} } as any,
      res,
      next,
    );

    expect(mockRepository.getContactById).toHaveBeenCalledWith("3");

    if (next.mock.calls.length > 0) {
      console.error("Error passed to next:", next.mock.calls[0][0]);
    }

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.OK);
    expect(res.json).toHaveBeenCalled();
  });

  it("getContactById passes error to next if contact not found", async () => {
    mockRepository.getContactById.mockResolvedValue(null);

    await controller.getContactById(
      { params: { id: "404" }, query: {} } as any,
      res,
      next,
    );

    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe("Contact with id: 404 not found");
    expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it("saveContact accepts empty subject and returns created", async () => {
    const req = {
      body: {
        name: "John Doe",
        email: "john.doe@example.com",
        message: "Hello from frontend",
        subject: "",
      },
    } as any;
    mockRepository.saveContact.mockResolvedValue(undefined);

    await controller.saveContact(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockRepository.saveContact).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: "John Doe",
        email: "john.doe@example.com",
        message: "Hello from frontend",
        subject: "",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.CREATED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HTTP_STATUS_CODES.CREATED,
      }),
    );
  });
});
