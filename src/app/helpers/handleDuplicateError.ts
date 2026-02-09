/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { IGenericErrorResponse } from "../interfaces/error.types";

const handleDuplicateError = (err: any): IGenericErrorResponse => {
  const matchedArray = err.message.match(/"([^"]*)"/);

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: `Duplicate key error. Please provide a unique value for ${matchedArray[1]}. Err: ${err.message}`,
  };
};

export default handleDuplicateError;
