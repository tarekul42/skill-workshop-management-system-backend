import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { deleteImageFromCloudinary } from "../config/cloudinary.config";
import envVariables from "../config/env";
import mongoose from "mongoose";
import { ZodError } from "zod";
import AppError from "../errorHelpers/AppError";
import handleCastError from "../helpers/handleCastError";
import handleDuplicateError from "../helpers/handleDuplicateError";
import handleValidationError from "../helpers/handleValidationError";
import handleZodError from "../helpers/handleZodError";
import { IErrorSources } from "../interfaces/error.types";
import logger from "../utils/logger";

const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (envVariables.NODE_ENV === "development") {
    logger.error({ message: "Global error caught", err });
  }

  // Clean up uploaded images on error - failures should not prevent error response
  try {
    if (req.file) {
      await deleteImageFromCloudinary(req.file.path);
    }

    if (req.files) {
      let filesToDelete: Express.Multer.File[] = [];

      if (Array.isArray(req.files)) {
        filesToDelete = req.files;
      } else {
        // Handle object form from multer fields()
        filesToDelete = Object.values(req.files).flat();
      }

      await Promise.all(
        filesToDelete.map((file) => deleteImageFromCloudinary(file.path)),
      );
    }
  } catch (cleanupError) {
    // Log but don't throw - cleanup failure shouldn't prevent error response
    logger.error({
      message: "Failed to clean up uploaded images",
      err: cleanupError,
    });
  }

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!!!";
  if (err instanceof Error) {
    message = `Something went wrong!!! ${err.message}`;
  }
  let errorSources: IErrorSources[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    if ("code" in err && (err as { code?: number }).code === 11000) {
      const simplifiedError = handleDuplicateError(err);

      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
    } else if (err.name === "CastError") {
      const simplifiedError = handleCastError(
        err as unknown as mongoose.Error.CastError,
      );

      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
    } else if (err.name === "ZodError") {
      const simplifiedError = handleZodError(err as unknown as ZodError);

      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      errorSources = simplifiedError.errorSources as IErrorSources[];
    } else if (err.name === "ValidationError") {
      const simplifiedError = handleValidationError(
        err as unknown as mongoose.Error.ValidationError,
      );

      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      errorSources = simplifiedError.errorSources as IErrorSources[];
    } else {
      statusCode = 500;
      message = err.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err: envVariables.NODE_ENV === "development" ? err : null,
    stack:
      envVariables.NODE_ENV === "development" && err instanceof Error
        ? err.stack
        : null,
  });
};

export default globalErrorHandler;
