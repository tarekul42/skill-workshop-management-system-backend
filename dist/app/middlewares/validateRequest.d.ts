import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";
declare const validateRequest: (zodSchema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default validateRequest;
