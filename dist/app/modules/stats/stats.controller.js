import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import StatsService from "./stats.service.js";
const getEnrollmentStatus = catchAsync(async (req, res) => {
    const stats = await StatsService.getEnrollmentStats();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Enrollment stats retrieved successfully",
        data: stats,
    });
});
const getPaymentStatus = catchAsync(async (req, res) => {
    const stats = await StatsService.getPaymentStats();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Payment stats retrieved successfully",
        data: stats,
    });
});
const getUserStats = catchAsync(async (req, res) => {
    const stats = await StatsService.getUsersStats();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "User stats retrieved successfully",
        data: stats,
    });
});
const getWorkshopStats = catchAsync(async (req, res) => {
    const stats = await StatsService.getWorkshopStats();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Workshop stats retrieved successfully",
        data: stats,
    });
});
const StatsController = {
    getEnrollmentStatus,
    getPaymentStatus,
    getUserStats,
    getWorkshopStats,
};
export default StatsController;
