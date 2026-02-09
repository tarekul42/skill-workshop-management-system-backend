/* eslint-disable no-console */
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import handleDuplicateError from "../helpers/handleDuplicateError";
import handleCastError from "../helpers/handleCastError";
import handleZodError from "../helpers/handleZodError";
import { IErrorSources } from "../interfaces/error.types";
import handleValidationError from "../helpers/handleValidationError";

const globalErrorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (envVariables.NODE_ENV === "development") {
    console.log(err);
  }

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = `Something went wrong!!! ${err.message}`;
  let errorSources: IErrorSources[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  } else if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err.name === "CastError") {
    const simplifiedError = handleCastError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err.name === "ZodError") {
    const simplifiedError = handleZodError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as IErrorSources[];
  } else if (err.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as IErrorSources[];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err: envVariables.NODE_ENV === "development" ? err : null,
    stack: envVariables.NODE_ENV === "development" ? err?.stack : null,
  });
};

export default globalErrorHandler;
