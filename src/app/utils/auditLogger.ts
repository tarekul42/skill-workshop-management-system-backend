import { ICreateAuditLog } from "../modules/audit/audit.interface.js";
import AuditLog from "../modules/audit/audit.model.js";
import { getAuditContext } from "./auditContext.js";
import logger from "./logger.js";

/**
 * Centralized helper to create an AuditLog entry.
 * Silently logs errors so as not to disrupt the main request flow.
 * Automatically enriches with IP and User-Agent from AsyncLocalStorage.
 */
const logAudit = async (params: ICreateAuditLog): Promise<void> => {
  try {
    const ctx = getAuditContext();
    await AuditLog.create({
      action: params.action,
      collectionName: params.collectionName,
      documentId: params.documentId,
      performedBy: params.performedBy ?? null,
      changes: params.changes ?? {},
      ipAddress: params.ipAddress ?? ctx?.ipAddress ?? null,
      userAgent: params.userAgent ?? ctx?.userAgent ?? null,
    });
  } catch (err) {
    // Audit failures should never break the main flow
    logger.error({ err, msg: "Failed to create audit log entry" });
  }
};

export default logAudit;
