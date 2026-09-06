import { describe, expect, it } from "bun:test";
import AppError from "../../src/app/errorHelpers/AppError";

describe("AppError", () => {
  it("should create an error with statusCode, message, and default code", () => {
    const error = new AppError(400, "Bad request");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error).toBeInstanceOf(Error);
  });

  it("should create an error with a custom code", () => {
    const error = new AppError(404, "Not found", "RESOURCE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("should use provided stack if given", () => {
    const customStack = "Error: test\n    at custom (file.js:1:1)";
    const error = new AppError(500, "Server error", "SERVER_ERROR", customStack);
    expect(error.stack).toBe(customStack);
  });

  it("should capture stack trace automatically", () => {
    const error = new AppError(403, "Forbidden");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("app-error.test.ts");
  });
});
