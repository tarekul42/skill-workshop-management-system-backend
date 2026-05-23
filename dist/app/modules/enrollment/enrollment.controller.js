import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { parseStringParam } from "../../utils/parseParams.js";
import sendResponse from "../../utils/sendResponse.js";
import EnrollmentService from "./enrollment.service.js";
const createEnrollment = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const payload = req.body;
    const result = await EnrollmentService.createEnrollment(payload, userId);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Enrollment created successfully",
        data: {
            enrollment: result.enrollment,
            paymentUrl: result.paymentUrl,
        },
    });
});
const getUserEnrollments = catchAsync(async (req, res) => {
    const decodeToken = req.user;
    const enrollments = await EnrollmentService.getUserEnrollments(decodeToken.userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Enrollments fetched successfully",
        data: enrollments,
    });
});
const getSingleEnrollment = catchAsync(async (req, res) => {
    const decodeToken = req.user;
    const enrollmentId = parseStringParam(req.params.enrollmentId, "enrollmentId");
    const enrollment = await EnrollmentService.getSingleEnrollment(enrollmentId, decodeToken.userId, decodeToken.role);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Enrollment fetched successfully",
        data: enrollment,
    });
});
const getAllEnrollments = catchAsync(async (req, res) => {
    const query = req.query;
    const enrollments = await EnrollmentService.getAllEnrollments(query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Enrollments fetched successfully",
        data: enrollments.data,
        meta: enrollments.meta,
    });
});
const updateEnrollmentStatus = catchAsync(async (req, res) => {
    const decodeToken = req.user;
    const enrollmentId = parseStringParam(req.params.enrollmentId, "enrollmentId");
    const status = req.body.status;
    await EnrollmentService.updateEnrollmentStatus(enrollmentId, status, decodeToken.userId, decodeToken.role);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Enrollment status updated successfully",
        data: null,
    });
});
const cancelEnrollment = catchAsync(async (req, res) => {
    const decodeToken = req.user;
    const enrollmentId = parseStringParam(req.params.enrollmentId, "enrollmentId");
    await EnrollmentService.cancelEnrollment(enrollmentId, decodeToken.userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Enrollment cancelled successfully",
        data: null,
    });
});
const EnrollmentController = {
    createEnrollment,
    getUserEnrollments,
    getSingleEnrollment,
    getAllEnrollments,
    updateEnrollmentStatus,
    cancelEnrollment,
};
export default EnrollmentController;
