import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error.types";

const handleCastError = (
  err: mongoose.Error.CastError,
): IGenericErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: `Invalid MongoDB ObjectId. Please provide a valid ObjectId. Err: ${err.message}`,
  };
};

export default handleCastError;
