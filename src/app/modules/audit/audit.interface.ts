import { Types } from "mongoose";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
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
