import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError.js";

export const parseStringParam = (value: unknown, paramName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Invalid ${paramName}`);
  }
  return value;
};
