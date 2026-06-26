import { StatusCodes } from "http-status-codes";
import { IGenericErrorResponse } from "../interfaces/error.types.js";

const handleDuplicateError = (): IGenericErrorResponse => {
  return {
    statusCode: StatusCodes.CONFLICT,
    message: "A record with that value already exists. Please use a different value.",
    code: "DUPLICATE_KEY",
  };
};

export default handleDuplicateError;
