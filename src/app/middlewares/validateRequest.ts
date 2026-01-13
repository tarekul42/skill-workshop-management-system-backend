import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

const validateRequest =
  (zodSchema: ZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await zodSchema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
