/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import {
  IErrorSources,
  IGenericErrorResponse,
} from "../interfaces/error.types";

const handleZodError = (err: any): IGenericErrorResponse => {
  const errorSources: IErrorSources[] = (err as ZodError).issues.map(
    (issue) => ({
      // Explicitly convert the value to a string to handle array indices (numbers)
      // and satisfy the 'string' type requirement of IErrorSources.
      path: String(issue.path[issue.path.length - 1] ?? "value"),
      message: issue.message,
    }),
  );

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Zod validation error",
    errorSources,
  };
};

export default handleZodError;
