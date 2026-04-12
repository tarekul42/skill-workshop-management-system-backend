import type { NextFunction, Request, Response } from "express";
declare const generalLimiter: (req: Request, res: Response, next: NextFunction) => void;
declare const healthLimiter: (req: Request, res: Response, next: NextFunction) => void;
declare const authLimiter: (req: Request, res: Response, next: NextFunction) => void;
declare const strictLimiter: (req: Request, res: Response, next: NextFunction) => void;
declare const adminCrudLimiter: (req: Request, res: Response, next: NextFunction) => void;
export { adminCrudLimiter, authLimiter, generalLimiter, healthLimiter, strictLimiter, };
