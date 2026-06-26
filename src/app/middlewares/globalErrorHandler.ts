import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError } from "zod";
import envVariables from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";
import handleCastError from "../helpers/handleCastError.js";
import handleDuplicateError from "../helpers/handleDuplicateError.js";
import handleValidationError from "../helpers/handleValidationError.js";
import handleZodError from "../helpers/handleZodError.js";
import { IErrorSources } from "../interfaces/error.types.js";
import logger from "../utils/logger.js";

const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  logger.error(
    {
      message:
        err instanceof Error
          ? err.message
          : JSON.stringify(err, Object.getOwnPropertyNames(err)),
      name: err instanceof Error ? err.name : "UnknownError",
      stack: err instanceof Error ? err.stack : undefined,
    },
    "Global error caught",
  );

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!!!";
  let code: string | undefined;
  let errorSources: IErrorSources[] = [];

  try {
    if (err instanceof AppError) {
      statusCode = err.statusCode;
      message = err.message;
      code = err.code;
    } else if (err instanceof ZodError) {
      const simplifiedError = handleZodError(err);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      code = simplifiedError.code;
      errorSources = simplifiedError.errorSources as IErrorSources[];
    } else if (err instanceof mongoose.Error.CastError) {
      const simplifiedError = handleCastError();
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      code = simplifiedError.code;
    } else if (err instanceof mongoose.Error.ValidationError) {
      const simplifiedError = handleValidationError(err);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      code = simplifiedError.code;
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
        code = "MULTER_ERROR";
      } else if (errorObj.code === "EBADCSRFTOKEN") {
        statusCode = StatusCodes.FORBIDDEN;
        code = "CSRF_TOKEN_INVALID";
        message =
          "Invalid CSRF token. Please ensure you have fetched a new token and included it in the 'x-csrf-token' header.";
      } else if (errorObj.code === 11000) {
        const simplifiedError = handleDuplicateError();
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        code = simplifiedError.code;
      } else {
        code = "UNEXPECTED_ERROR";
        message = err.message || "Something went wrong!!!";
      }
    }
  } catch (handlerErr) {
    logger.error(
      { err: handlerErr, originalErr: err },
      "Error handler threw an exception",
    );
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = "An unexpected error occurred while handling your request.";
    code = "ERROR_HANDLER_FAILURE";
  }

  const responseBody: {
    success: boolean;
    message: string;
    code?: string;
    errorSources: IErrorSources[];
    err?: { name: string; message: string } | { message: string };
    stack?: string | null;
  } = {
    success: false,
    message,
    code,
    errorSources,
  };

  if (envVariables.NODE_ENV === "development") {
    responseBody.err =
      err instanceof Error
        ? { name: err.name, message: err.message }
        : { message: JSON.stringify(err, Object.getOwnPropertyNames(err)) };
    responseBody.stack = err instanceof Error ? err.stack : null;
  }

  res.status(statusCode).json(responseBody);
};

export default globalErrorHandler;
