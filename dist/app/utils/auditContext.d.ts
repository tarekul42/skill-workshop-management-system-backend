import { NextFunction, Request, Response } from "express";
interface AuditContextData {
    userId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
}
/**
 * Express middleware that captures the current user's identity and request
 * metadata into AsyncLocalStorage so Mongoose plugins can access it
 * without needing a reference to `req`.
 */
declare const auditContextMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Retrieve the current audit context from AsyncLocalStorage.
 * Returns null if called outside a request context (e.g., scripts, seeders).
 */
declare const getAuditContext: () => AuditContextData | null;
export { auditContextMiddleware, getAuditContext };
