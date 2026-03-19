"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const auditLogger_1 = __importDefault(require("../../utils/auditLogger"));
const audit_interface_1 = require("../audit/audit.interface");
const enrollment_interface_1 = require("./enrollment.interface");
const enrollment_model_1 = __importDefault(require("./enrollment.model"));
const enrollment_repository_1 = __importDefault(require("./enrollment.repository"));
const createEnrollment = async (payload, userId) => {
    if (!payload.workshop) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop ID is required.");
    }
    if (typeof payload.workshop !== "string") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop ID must be a string.");
    }
    const session = await enrollment_repository_1.default.startTransaction();
    try {
        const result = await enrollment_repository_1.default.createEnrollmentWithPayment(payload, userId, session);
        await session.commitTransaction();
        session.endSession();
        await (0, auditLogger_1.default)({
            action: audit_interface_1.AuditAction.CREATE,
            collectionName: "Enrollment",
            documentId: result.enrollmentId,
            performedBy: userId,
        });
        return {
            paymentUrl: result.paymentUrl,
            enrollment: result.enrollment,
        };
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
const getUserEnrollments = async (userId) => {
    const enrollment = await enrollment_model_1.default.find({ user: userId })
        .populate("user", "name email phone")
        .populate("workshop", "title price images location startDate")
        .populate("payment", "status amount transactionId");
    return {
        data: enrollment,
    };
};
const getSingleEnrollment = async (enrollmentId, userId, userRole) => {
    const enrollment = await enrollment_model_1.default.findOne({
        _id: { $eq: new mongoose_1.Types.ObjectId(enrollmentId) },
    })
        .populate("user", "name email phone address")
        .populate("workshop", "title price images location startDate endDate")
        .populate("payment", "status amount transactionId invoiceUrl");
    if (!enrollment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const populatedEnrollment = enrollment;
    const isOwner = populatedEnrollment.user && String(populatedEnrollment.user._id) === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to view this enrollment");
    }
    return populatedEnrollment;
};
const getAllEnrollments = async (query) => {
    const { status, page = 1, limit = 10 } = query;
    const filter = {};
    if (typeof status === "string") {
        const allowedStatuses = Object.values(enrollment_interface_1.ENROLLMENT_STATUS);
        if (allowedStatuses.includes(status)) {
            filter.status = status;
        }
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [enrollments, total] = await Promise.all([
        enrollment_model_1.default.find(filter)
            .populate("user", "name email phone")
            .populate("workshop", "title price images location")
            .populate("payment", "status amount transactionId")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        enrollment_model_1.default.countDocuments(filter),
    ]);
    return {
        data: enrollments,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPage: Math.ceil(total / Number(limit)),
        },
    };
};
const updateEnrollmentStatus = async (enrollmentId, status, userRole) => {
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admins can update enrollment status");
    }
    const allowedStatuses = Object.values(enrollment_interface_1.ENROLLMENT_STATUS);
    if (!allowedStatuses.includes(status)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid enrollment status");
    }
    const enrollment = await enrollment_model_1.default.findOne({
        _id: { $eq: new mongoose_1.Types.ObjectId(enrollmentId) },
    });
    if (!enrollment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const updatedEnrollment = await enrollment_model_1.default.findOneAndUpdate({ _id: { $eq: new mongoose_1.Types.ObjectId(enrollmentId) } }, { status }, { returnDocument: "after", runValidators: true })
        .populate("user", "name email phone")
        .populate("workshop", "title price")
        .populate("payment", "status amount transactionId");
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.UPDATE,
        collectionName: "Enrollment",
        documentId: enrollmentId,
        changes: { status },
    });
    return updatedEnrollment;
};
const EnrollmentService = {
    createEnrollment,
    getUserEnrollments,
    getSingleEnrollment,
    getAllEnrollments,
    updateEnrollmentStatus,
};
exports.default = EnrollmentService;
