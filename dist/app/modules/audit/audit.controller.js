import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { parseStringParam } from "../../utils/parseParams.js";
import sendResponse from "../../utils/sendResponse.js";
import AuditService from "./audit.service.js";
const getAuditLogs = catchAsync(async (req, res) => {
    const { page, limit, collectionName, action, performedBy, documentId, startDate, endDate, } = req.query;
    const result = await AuditService.getAuditLogs({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        collectionName: collectionName,
        action: action,
        performedBy: performedBy,
        documentId: documentId,
        startDate: startDate,
        endDate: endDate,
    });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Audit logs retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});
const getAuditLogById = catchAsync(async (req, res) => {
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
