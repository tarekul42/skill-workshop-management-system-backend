import { NextFunction, Request, Response } from "express";
declare const checkAuth: (...authRoles: string[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default checkAuth;
