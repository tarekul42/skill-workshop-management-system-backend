import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodObject } from "zod";
import AppError from "../errorHelpers/AppError";

const validateRequest =
  (zodSchema: ZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.body) {
        req.body = {};
      }

      if (req.body.data && typeof req.body.data === "string") {
        try {
          req.body = JSON.parse(req.body.data);
        } catch {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Invalid JSON in request body.data",
          );
        }
      } else if (req.body.data && typeof req.body.data === "object") {
        req.body = req.body.data;
      }

      req.body = await zodSchema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
