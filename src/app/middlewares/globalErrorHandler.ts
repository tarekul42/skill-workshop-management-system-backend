import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";

const globalErrorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = `Something went wrong!!! ${err.message}`;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    err,
    stack: envVariables.NODE_ENV === "development" ? err?.stack : null,
  });
};

export default globalErrorHandler;
