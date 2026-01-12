import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import envVariables from "../config/env";

const globalErrorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  const message = `Something went wrong!!! ${err.message}`;

  res.status(statusCode).json({
    success: false,
    message,
    err,
    stack: envVariables.NODE_ENV === "development" ? err?.stack : null,
  });
};

export default globalErrorHandler;
