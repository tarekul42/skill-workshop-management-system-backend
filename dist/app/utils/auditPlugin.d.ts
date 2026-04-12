import { Schema } from "mongoose";
/**
 * Mongoose plugin that automatically logs CREATE, UPDATE, and DELETE operations
 * to the AuditLog collection.
 */
declare const auditPlugin: (schema: Schema) => void;
export default auditPlugin;
