import { Types } from "mongoose";
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE"
}
export interface IAuditLog {
    action: AuditAction;
    collectionName: string;
    documentId: Types.ObjectId;
    performedBy: Types.ObjectId | null;
    changes: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt?: Date;
}
/** Input type for the logAudit helper (performedBy can be a string ID) */
export interface ICreateAuditLog {
    action: AuditAction;
    collectionName: string;
    documentId: Types.ObjectId | string;
    performedBy?: Types.ObjectId | string | null;
    changes?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
}
