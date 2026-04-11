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
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  logger.error(err, "Global error caught");

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!!!";
  let errorSources: IErrorSources[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as IErrorSources[];
  } else if (err instanceof mongoose.Error.CastError) {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as IErrorSources[];
  } else if (err instanceof Error) {
    const errorObj = err as Error & { code?: string | number };
    const errName = errorObj.name || "";
    const errMessage = errorObj.message || "";

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
      message =
        "Invalid CSRF token. Please ensure you have fetched a new token and included it in the 'x-csrf-token' header.";
    } else if (errorObj.code === 11000) {
      const simplifiedError = handleDuplicateError(err);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
    } else {
      message = err.message || "Something went wrong!!!";
    }
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
