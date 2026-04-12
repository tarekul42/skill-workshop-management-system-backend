import { NextFunction, Request, Response } from "express";
declare const mongoSanitizeCustom: (req: Request, _res: Response, next: NextFunction) => void;
export default mongoSanitizeCustom;
