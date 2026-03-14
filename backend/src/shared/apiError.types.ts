export enum API_ERROR_TYPES {
  VALIDATION_ERROR = "ValidationError",
  CONTACT_NOT_FOUND_ERROR = "ContactNotFoundError",
  INVALID_ID_ERROR = "InvalidIdError",
}

export enum HTTP_STATUS_CODES {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}
