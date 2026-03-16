import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError } from "zod";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import handleCastError from "../helpers/handleCastError";
import handleDuplicateError from "../helpers/handleDuplicateError";
import handleValidationError from "../helpers/handleValidationError";
import handleZodError from "../helpers/handleZodError";
import { IErrorSources } from "../interfaces/error.types";
import logger from "../utils/logger";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (envVariables.NODE_ENV === "development") {
    logger.error({ message: "Global error caught", err });
  }

  // Note: Image cleanup on error is handled at the route/controller level.

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!!!";
  if (err instanceof Error) {
    message = `Something went wrong!!! ${err.message}`;
  }
  let errorSources: IErrorSources[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err && typeof err === "object") {
    const errorObj = err as Record<string, unknown>;
    const errName = (errorObj.name as string) || "";
    const errMessage = (errorObj.message as string) || "";

    // Multer or custom file type errors should be 400
    if (
      errName === "MulterError" ||
      errMessage.includes("Invalid file type") ||
      errMessage.includes("Unexpected field") ||
      errMessage.includes("Invalid image file")
    ) {
      statusCode = StatusCodes.BAD_REQUEST;
      message = errMessage;
    } else if (errorObj.code === "EBADCSRFTOKEN") {
      statusCode = StatusCodes.FORBIDDEN;
      message = "Invalid CSRF token";
    } else if (errorObj.code === 11000) {
      const simplifiedError = handleDuplicateError(err as Error);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
    } else if (errName === "CastError") {
      const simplifiedError = handleCastError(
        err as unknown as mongoose.Error.CastError,
      );
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
    } else if (errName === "ZodError") {
      const simplifiedError = handleZodError(err as unknown as ZodError);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      errorSources = simplifiedError.errorSources as IErrorSources[];
    } else if (errName === "ValidationError") {
      const simplifiedError = handleValidationError(
        err as unknown as mongoose.Error.ValidationError,
      );
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      errorSources = simplifiedError.errorSources as IErrorSources[];
    } else {
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = errMessage || "Something went wrong!!!";
    }
  } else if (err instanceof Error) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = err.message;
  }

  const responseBody: {
    success: boolean;
    message: string;
    errorSources: IErrorSources[];
    err?: { name: string; message: string } | { message: string };
    stack?: string | null;
  } = {
    success: false,
    message,
    errorSources,
  };

  if (envVariables.NODE_ENV === "development") {
    responseBody.err =
      err instanceof Error
        ? { name: err.name, message: err.message }
        : { message: String(err) };
    responseBody.stack = err instanceof Error ? err.stack : null;
  }

  res.status(statusCode).json(responseBody);
};

export default globalErrorHandler;
