"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const enrollment_service_1 = __importDefault(require("./enrollment.service"));
const createEnrollment = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.userId;
    const payload = req.body;
    const result = await enrollment_service_1.default.createEnrollment(payload, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Enrollment created successfully",
        data: {
            enrollment: result.enrollment,
            paymentUrl: result.paymentUrl,
        },
    });
});
const getUserEnrollments = (0, catchAsync_1.default)(async (req, res) => {
    const decodeToken = req.user;
    const enrollments = await enrollment_service_1.default.getUserEnrollments(decodeToken.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Enrollments fetched successfully",
        data: enrollments,
    });
});
const getSingleEnrollment = (0, catchAsync_1.default)(async (req, res) => {
    const decodeToken = req.user;
    const enrollmentId = req.params.enrollmentId;
    const enrollment = await enrollment_service_1.default.getSingleEnrollment(enrollmentId, decodeToken.userId, decodeToken.role);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Enrollment fetched successfully",
        data: enrollment,
    });
});
const getAllEnrollments = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const enrollments = await enrollment_service_1.default.getAllEnrollments(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Enrollments fetched successfully",
        data: enrollments,
        meta: enrollments.meta,
    });
});
const updateEnrollmentStatus = (0, catchAsync_1.default)(async (req, res) => {
    const decodeToken = req.user;
    const enrollmentId = req.params.enrollmentId;
    const status = req.body.status;
    const updatedEnrollment = await enrollment_service_1.default.updateEnrollmentStatus(enrollmentId, status, decodeToken.role);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Enrollment status updated successfully",
        data: updatedEnrollment,
    });
});
const EnrollmentController = {
    createEnrollment,
    getUserEnrollments,
    getSingleEnrollment,
    getAllEnrollments,
    updateEnrollmentStatus,
};
exports.default = EnrollmentController;
