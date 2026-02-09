/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import {
  IErrorSources,
  IGenericErrorResponse,
} from "../interfaces/error.types";

const handleZodError = (err: any): IGenericErrorResponse => {
  const errorSources: IErrorSources[] = [];

  err.issues.forEach((issue: any) => {
    errorSources.push({
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    });
  });

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Zod validation error",
    errorSources,
  };
};

export default handleZodError;
