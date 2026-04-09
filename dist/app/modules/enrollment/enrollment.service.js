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
const queryBuilder_1 = __importDefault(require("../../utils/queryBuilder"));
const user_interface_1 = require("../user/user.interface");
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
    const isAdmin = (0, user_interface_1.isAdminRole)(userRole);
    if (!isOwner && !isAdmin) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to view this enrollment");
    }
    return populatedEnrollment;
};
const getAllEnrollments = async (query) => {
    const queryBuilder = new queryBuilder_1.default(enrollment_model_1.default.find(), query);
    const enrollmentsData = queryBuilder.filter().sort().fields().paginate();
    const [data, meta] = await Promise.all([
        enrollmentsData
            .build()
            .populate("user", "name email phone")
            .populate("workshop", "title price images location")
            .populate("payment", "status amount transactionId"),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
};
const updateEnrollmentStatus = async (enrollmentId, status, userId, userRole) => {
    if (!(0, user_interface_1.isAdminRole)(userRole)) {
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
        performedBy: userId,
        changes: { status },
    });
    return updatedEnrollment;
};
const cancelEnrollment = async (enrollmentId, userId) => {
    const enrollment = await enrollment_model_1.default.findOne({
        _id: { $eq: new mongoose_1.Types.ObjectId(enrollmentId) },
    })
        .populate("user", "name email")
        .populate("payment", "status");
    if (!enrollment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const populatedEnrollment = enrollment;
    if (String(populatedEnrollment.user._id) !== userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only cancel your own enrollments");
    }
    if (enrollment.status !== enrollment_interface_1.ENROLLMENT_STATUS.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Only pending enrollments can be cancelled");
    }
    const updatedEnrollment = await enrollment_model_1.default.findOneAndUpdate({ _id: { $eq: new mongoose_1.Types.ObjectId(enrollmentId) } }, { status: enrollment_interface_1.ENROLLMENT_STATUS.CANCEL }, { returnDocument: "after", runValidators: true });
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.UPDATE,
        collectionName: "Enrollment",
        documentId: enrollmentId,
        performedBy: userId,
        changes: { status: enrollment_interface_1.ENROLLMENT_STATUS.CANCEL },
    });
    return updatedEnrollment;
};
const EnrollmentService = {
    createEnrollment,
    getUserEnrollments,
    getSingleEnrollment,
    getAllEnrollments,
    updateEnrollmentStatus,
    cancelEnrollment,
};
exports.default = EnrollmentService;
