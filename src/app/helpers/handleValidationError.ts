/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import {
  IErrorSources,
  IGenericErrorResponse,
} from "../interfaces/error.types";
import { StatusCodes } from "http-status-codes";

const handleValidationError = (
  err: mongoose.Error.ValidationError,
): IGenericErrorResponse => {
  const errorSources: IErrorSources[] = [];

  const errors = Object.values(err.errors);

  errors.forEach((errorObject: any) =>
    errorSources.push({
      path: errorObject.path,
      message: errorObject.message,
    }),
  );

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Validation Error Occurred",
    errorSources,
  };
};

export default handleValidationError;
