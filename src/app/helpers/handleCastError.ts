import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error.types.js";

const handleCastError = (
  err: mongoose.Error.CastError,
): IGenericErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: `Invalid value "${err.value}" for field "${err.path}". Please provide a valid ${err.kind}.`,
  };
};

export default handleCastError;
