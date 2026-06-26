import { describe, expect, it } from "bun:test";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError, z } from "zod";
import handleCastError from "../../src/app/helpers/handleCastError";
import handleDuplicateError from "../../src/app/helpers/handleDuplicateError";
import handleValidationError from "../../src/app/helpers/handleValidationError";
import handleZodError from "../../src/app/helpers/handleZodError";

describe("handleCastError", () => {
  it("should return 400 with generic message", () => {
    const result = handleCastError();
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toBe("Invalid ID format. Please provide a valid ID.");
  });
});

describe("handleDuplicateError", () => {
  it("should return 409 with generic message and DUPLICATE_KEY code", () => {
    const result = handleDuplicateError();
    expect(result.statusCode).toBe(StatusCodes.CONFLICT);
    expect(result.message).toBe("A record with that value already exists. Please use a different value.");
    expect(result.code).toBe("DUPLICATE_KEY");
  });
});

describe("handleValidationError", () => {
  it("should return 400 with field-level error messages", () => {
    const validationError = new mongoose.Error.ValidationError();
    validationError.errors = {
      name: new mongoose.Error.ValidatorError({
        message: "Path `name` is required.",
        path: "name",
        type: "required",
        value: undefined,
      }),
    };

    const result = handleValidationError(validationError);
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toBe("Validation Error Occurred");
    expect(result.errorSources).toHaveLength(1);
    expect(result.errorSources![0].path).toBe("name");
    expect(result.errorSources![0].message).toContain("required");
  });
});

describe("handleZodError", () => {
  it("should return 400 with field-level Zod issues", () => {
    const schema = z.object({
      email: z.string().email("Invalid email"),
      age: z.number().min(18, "Must be at least 18"),
    });

    let zodError: ZodError;
    try {
      schema.parse({ email: "not-an-email", age: 15 });
    } catch (err) {
      zodError = err as ZodError;
    }

    const result = handleZodError(zodError!);
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toBe("Zod validation error");
    expect(result.errorSources!.length).toBeGreaterThanOrEqual(2);
    expect(result.errorSources![0].path).toBeDefined();
    expect(result.errorSources![0].message).toBeDefined();
  });
});
