/**
 * Validation utilities for contact-related requests.
 *
 * Exports ContactsValidators which provides methods to validate:
 * - contact search request payloads (validateFindContactRequest)
 * - query/display parameters for contact endpoints (validateQueryParams)
 * - environment variable requirements (environmentVariablesValidator)
 *
 * Uses zod schemas to parse and assert incoming shapes and types.
 */
import { z } from "zod";
import { Contact } from "../shared";

/**
 * Collection of contact-related validators using zod schemas.
 * Each method validates incoming data and returns the parsed/validated value.
 */
class ContactsValidators {
  /**
   * Validate required environment variables and provide defaults where applicable.
   *
   * @returns {Promise<Record<string, string>>} parsed environment configuration
   */
  async environmentVariablesValidator(): Promise<Record<string, string>> {
    const envSchema = z.object({
      PORT: z.string().default(process.env.PORT || "3000"),
      NODE_ENV: z.enum(["development", "production"]).default("development"),
      DB_USER: z.string().min(1, "DB_USER is required"),
      DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
      DB_HOST: z.string().min(1, "DB_HOST is required"),
      DB_NAME: z.string().min(1, "DB_NAME is required"),
      DB_PORT: z
        .string()
        .regex(/^\d+$/, "DB_PORT must be a number")
        .default(process.env.DB_PORT || "5555"),
      CORS_ORIGIN: z.string().optional().default(process.env.CORS_ORIGIN || "*"),
    });
    const env = envSchema.parse(process.env);
    return env;
  }

  async validateSaveContactRequest(
    data: Omit<Contact, "id">,
  ): Promise<Omit<Contact, "id">> {
    const contactSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.email("Invalid email address"),
      subject: z.string().optional(),
      message: z
        .string()
        .min(10, "Message must be at least 10 characters long"),
    });
    const result = contactSchema.parse(data);
    return result;
  }
}
export { ContactsValidators };
