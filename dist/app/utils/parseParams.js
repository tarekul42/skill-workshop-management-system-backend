import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError";
export const parseStringParam = (value, paramName) => {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, `Invalid ${paramName}`);
    }
    return value;
};
