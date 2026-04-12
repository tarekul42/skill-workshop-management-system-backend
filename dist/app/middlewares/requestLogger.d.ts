import { NextFunction, Request, Response } from "express";
declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export default requestLogger;
