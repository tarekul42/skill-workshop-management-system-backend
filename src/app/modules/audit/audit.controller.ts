import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { parseStringParam } from "../../utils/parseParams.js";
import sendResponse from "../../utils/sendResponse.js";
import AuditService from "./audit.service.js";

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    collectionName,
    action,
    performedBy,
    documentId,
    startDate,
    endDate,
  } = req.query;

  const result = await AuditService.getAuditLogs({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    collectionName: collectionName as string | undefined,
    action: action as string | undefined,
    performedBy: performedBy as string | undefined,
    documentId: documentId as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Audit logs retrieved successfully",
    data: result,
  });
});

const getAuditLogById = catchAsync(async (req: Request, res: Response) => {
  const id = parseStringParam(req.params.id, "id");
  const log = await AuditService.getAuditLogById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Audit log retrieved successfully",
    data: log,
  });
});

const AuditController = {
  getAuditLogs,
  getAuditLogById,
};

export default AuditController;
