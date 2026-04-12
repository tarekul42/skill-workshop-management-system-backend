import { ICreateAuditLog } from "../modules/audit/audit.interface.js";
/**
 * Centralized helper to create an AuditLog entry.
 * Silently logs errors so as not to disrupt the main request flow.
 */
declare const logAudit: (params: ICreateAuditLog) => Promise<void>;
export default logAudit;
