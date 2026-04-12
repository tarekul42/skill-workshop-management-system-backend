import { AsyncLocalStorage } from "async_hooks";
const auditStorage = new AsyncLocalStorage();
/**
 * Express middleware that captures the current user's identity and request
 * metadata into AsyncLocalStorage so Mongoose plugins can access it
 * without needing a reference to `req`.
 */
const auditContextMiddleware = (req, _res, next) => {
    const context = {
        userId: req.user?.userId ?? null,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        userAgent: req.get("User-Agent") ?? null,
    };
    auditStorage.run(context, () => next());
};
/**
 * Retrieve the current audit context from AsyncLocalStorage.
 * Returns null if called outside a request context (e.g., scripts, seeders).
 */
const getAuditContext = () => {
    return auditStorage.getStore() ?? null;
};
export { auditContextMiddleware, getAuditContext };
