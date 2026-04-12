import { NextFunction, Request, Response } from "express";
/**
 * Middleware to verify password reset tokens using the dedicated RESET_PASSWORD_SECRET.
 * Also checks for user status and token blacklisting.
 */
declare const checkResetToken: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default checkResetToken;
