import { NextFunction, Request, Response } from "express";
declare const globalErrorHandler: (err: unknown, _req: Request, res: Response, _next: NextFunction) => void;
export default globalErrorHandler;
