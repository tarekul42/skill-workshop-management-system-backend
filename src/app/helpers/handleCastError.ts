import { StatusCodes } from "http-status-codes";
import { IGenericErrorResponse } from "../interfaces/error.types.js";

const handleCastError = (): IGenericErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: `Invalid ID format. Please provide a valid ID.`,
  };
};

export default handleCastError;
