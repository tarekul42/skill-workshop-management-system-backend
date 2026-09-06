import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import {
  IErrorSources,
  IGenericErrorResponse,
} from "../interfaces/error.types.js";

const handleValidationError = (
  err: mongoose.Error.ValidationError,
): IGenericErrorResponse => {
  const errorSources: IErrorSources[] = [];

  const errors = Object.values(err.errors);

  errors.forEach(
    (errorObject: mongoose.Error.ValidatorError | mongoose.Error.CastError) =>
      errorSources.push({
        path: errorObject.path,
        message: errorObject.message,
      }),
  );

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Please check your input and try again.",
    errorSources,
  };
};

export default handleValidationError;
