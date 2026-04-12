import { model, Schema } from "mongoose";
import { AuditAction } from "./audit.interface.js";
const auditLogSchema = new Schema({
    action: {
        type: String,
        enum: Object.values(AuditAction),
        required: true,
        index: true,
    },
    collectionName: {
        type: String,
        required: true,
        index: true,
    },
    documentId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
    },
    changes: {
        type: Schema.Types.Mixed,
        default: {},
    },
    ipAddress: {
        type: String,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
// TTL index: auto-delete audit logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// Compound index for common queries
auditLogSchema.index({ collectionName: 1, documentId: 1 });
auditLogSchema.index({ collectionName: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
const AuditLog = model("AuditLog", auditLogSchema);
export default AuditLog;
