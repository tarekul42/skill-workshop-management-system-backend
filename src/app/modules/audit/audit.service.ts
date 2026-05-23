import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import AuditLog from "./audit.model.js";

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

const toEqFilter = (value: unknown): { $eq: string } | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid query parameter type");
  }
  return { $eq: value };
};

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

  const collectionNameFilter = toEqFilter(collectionName);
  if (collectionNameFilter) filter.collectionName = collectionNameFilter;

  const actionFilter = toEqFilter(action);
  if (actionFilter) filter.action = actionFilter;

  const performedByFilter = toEqFilter(performedBy);
  if (performedByFilter) filter.performedBy = performedByFilter;

  const documentIdFilter = toEqFilter(documentId);
  if (documentIdFilter) filter.documentId = documentIdFilter;

  if (startDate || endDate) {
    if (
      (startDate && typeof startDate !== "string") ||
      (endDate && typeof endDate !== "string")
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid date range query parameter type",
      );
    }

    const createdAtFilter: Record<string, unknown> = {};
    if (startDate) {
      const gteDate = new Date(startDate);
      if (Number.isNaN(gteDate.getTime())) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Invalid startDate query parameter",
        );
      }
      createdAtFilter.$gte = gteDate;
    }
    if (endDate) {
      const lteDate = new Date(endDate);
      if (Number.isNaN(lteDate.getTime())) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Invalid endDate query parameter",
        );
      }
      createdAtFilter.$lte = lteDate;
    }
    if (Object.keys(createdAtFilter).length > 0) {
      filter.createdAt = createdAtFilter;
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
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
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
