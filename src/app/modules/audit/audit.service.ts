import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import AuditLog from "./audit.model";

interface AuditQueryParams {
  page?: number;
  limit?: number;
  collectionName?: string;
  action?: string;
  performedBy?: string;
  documentId?: string;
  startDate?: string;
  endDate?: string;
}

const getAuditLogs = async (params: AuditQueryParams) => {
  const {
    page = 1,
    limit = 20,
    collectionName,
    action,
    performedBy,
    documentId,
    startDate,
    endDate,
  } = params;

  const filter: Record<string, unknown> = {};

  if (collectionName) filter.collectionName = collectionName;
  if (action) filter.action = action;
  if (performedBy) filter.performedBy = performedBy;
  if (documentId) filter.documentId = documentId;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      (filter.createdAt as Record<string, unknown>).$gte = new Date(startDate);
    }
    if (endDate) {
      (filter.createdAt as Record<string, unknown>).$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "name email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAuditLogById = async (id: string) => {
  const log = await AuditLog.findById(id)
    .populate("performedBy", "name email role")
    .lean();

  if (!log) {
    throw new AppError(StatusCodes.NOT_FOUND, "Audit log not found");
  }

  return log;
};

const AuditService = {
  getAuditLogs,
  getAuditLogById,
};

export default AuditService;
