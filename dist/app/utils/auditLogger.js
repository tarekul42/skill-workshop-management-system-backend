import AuditLog from "../modules/audit/audit.model.js";
import logger from "./logger.js";
/**
 * Centralized helper to create an AuditLog entry.
 * Silently logs errors so as not to disrupt the main request flow.
 */
const logAudit = async (params) => {
    try {
        await AuditLog.create({
            action: params.action,
            collectionName: params.collectionName,
            documentId: params.documentId,
            performedBy: params.performedBy ?? null,
            changes: params.changes ?? {},
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
        });
    }
    catch (err) {
        // Audit failures should never break the main flow
        logger.error({ err, msg: "Failed to create audit log entry" });
    }
};
export default logAudit;
