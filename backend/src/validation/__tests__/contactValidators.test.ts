import { ContactsValidators } from "..";

describe("ContactsValidators", () => {
  let validator: ContactsValidators;

  beforeEach(() => {
    validator = new ContactsValidators();
  });

  describe("environmentVariablesValidator", () => {
    const originalEnv = process.env;

    const setRequiredDbEnv = () => {
      process.env.DB_USER = "postgres";
      process.env.DB_PASSWORD = "postgres";
      process.env.DB_HOST = "localhost";
      process.env.DB_NAME = "portfolio";
    };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should validate valid environment variables", async () => {
      process.env.PORT = "3000";
      process.env.NODE_ENV = "development";
      process.env.DB_PORT = "5555";
      setRequiredDbEnv();

      const result = await validator.environmentVariablesValidator();
      expect(result).toHaveProperty("PORT", "3000");
      expect(result).toHaveProperty("NODE_ENV", "development");
      expect(result).toHaveProperty("DB_PORT", "5555");
    });

    it("should use defaults for missing env vars", async () => {
      delete process.env.PORT;
      delete process.env.DB_PORT;
      process.env.NODE_ENV = "development";
      setRequiredDbEnv();

      const result = await validator.environmentVariablesValidator();
      expect(result.PORT).toBe("3000");
      expect(result.DB_PORT).toBe("5555");
    });

    it("should validate production environment", async () => {
      process.env.PORT = "8080";
      process.env.NODE_ENV = "production";
      process.env.DB_PORT = "5555";
      setRequiredDbEnv();

      const result = await validator.environmentVariablesValidator();
      expect(result).toHaveProperty("NODE_ENV", "production");
    });

    it("should throw when required DB env vars are missing", async () => {
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_HOST;
      delete process.env.DB_NAME;

      await expect(validator.environmentVariablesValidator()).rejects.toThrow();
    });
  });

  describe("validateSaveContactRequest", () => {
    it("should validate a valid contact request", async () => {
      const validData = {
        name: "John Doe",
        email: "john.doe@example.com",
        subject: "Hello",
        message: "This is a test message",
      };

      const result = await validator.validateSaveContactRequest(validData);
      expect(result).toEqual(validData);
    });

    it("should throw when name is missing", async () => {
      const invalidData = {
        name: "",
        email: "john.doe@example.com",
        subject: "Hello",
        message: "This is a test message",
      };

      await expect(validator.validateSaveContactRequest(invalidData)).rejects.toThrow();
    });

    it("should throw when email is invalid", async () => {
      const invalidData = {
        name: "John Doe",
        email: "not-an-email",
        subject: "Hello",
        message: "This is a test message",
      };

      await expect(validator.validateSaveContactRequest(invalidData)).rejects.toThrow();
    });

    it("should throw when message is too short", async () => {
      const invalidData = {
        name: "John Doe",
        email: "john.doe@example.com",
        subject: "Hello",
        message: "Too short",
      };

      await expect(validator.validateSaveContactRequest(invalidData)).rejects.toThrow();
    });

    it("should allow optional subject", async () => {
      const validData = {
        name: "John Doe",
        email: "john.doe@example.com",
        message: "This is a test message",
      };

      const result = await validator.validateSaveContactRequest(validData);
      expect(result).toEqual(validData);
    });
  });
});
