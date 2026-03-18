import { AsyncLocalStorage } from "async_hooks";
import { NextFunction, Request, Response } from "express";

interface AuditContextData {
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

const auditStorage = new AsyncLocalStorage<AuditContextData>();

/**
 * Express middleware that captures the current user's identity and request
 * metadata into AsyncLocalStorage so Mongoose plugins can access it
 * without needing a reference to `req`.
 */
const auditContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const context: AuditContextData = {
    userId: (req.user as Record<string, string>)?.userId ?? null,
    ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
    userAgent: req.get("User-Agent") ?? null,
  };

  auditStorage.run(context, () => next());
};

/**
 * Retrieve the current audit context from AsyncLocalStorage.
 * Returns null if called outside a request context (e.g., scripts, seeders).
 */
const getAuditContext = (): AuditContextData | null => {
  return auditStorage.getStore() ?? null;
};

export { auditContextMiddleware, getAuditContext };
