import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import auditLogger from "../../utils/auditLogger";
import QueryBuilder from "../../utils/queryBuilder";
import { AuditAction } from "../audit/audit.interface";
import { isAdminRole } from "../user/user.interface";
import { ENROLLMENT_STATUS, } from "./enrollment.interface";
import Enrollment from "./enrollment.model";
import EnrollmentRepository from "./enrollment.repository";
const createEnrollment = async (payload, userId) => {
    if (!payload.workshop) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Workshop ID is required.");
    }
    if (typeof payload.workshop !== "string") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Workshop ID must be a string.");
    }
    const session = await EnrollmentRepository.startTransaction();
    try {
        const result = await EnrollmentRepository.createEnrollmentWithPayment(payload, userId, session);
        await session.commitTransaction();
        session.endSession();
        await auditLogger({
            action: AuditAction.CREATE,
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
    const enrollment = await Enrollment.find({ user: userId })
        .populate("user", "name email phone")
        .populate("workshop", "title price images location startDate")
        .populate("payment", "status amount transactionId");
    return {
        data: enrollment,
    };
};
const getSingleEnrollment = async (enrollmentId, userId, userRole) => {
    const enrollment = await Enrollment.findOne({
        _id: { $eq: new Types.ObjectId(enrollmentId) },
    })
        .populate("user", "name email phone address")
        .populate("workshop", "title price images location startDate endDate")
        .populate("payment", "status amount transactionId invoiceUrl");
    if (!enrollment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const populatedEnrollment = enrollment;
    const isOwner = populatedEnrollment.user && String(populatedEnrollment.user._id) === userId;
    const isAdmin = isAdminRole(userRole);
    if (!isOwner && !isAdmin) {
        throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized to view this enrollment");
    }
    return populatedEnrollment;
};
const getAllEnrollments = async (query) => {
    const queryBuilder = new QueryBuilder(Enrollment.find(), query);
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
    if (!isAdminRole(userRole)) {
        throw new AppError(StatusCodes.FORBIDDEN, "Only admins can update enrollment status");
    }
    const allowedStatuses = Object.values(ENROLLMENT_STATUS);
    if (!allowedStatuses.includes(status)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment status");
    }
    const enrollment = await Enrollment.findOne({
        _id: { $eq: new Types.ObjectId(enrollmentId) },
    });
    if (!enrollment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const updatedEnrollment = await Enrollment.findOneAndUpdate({ _id: { $eq: new Types.ObjectId(enrollmentId) } }, { status }, { returnDocument: "after", runValidators: true })
        .populate("user", "name email phone")
        .populate("workshop", "title price")
        .populate("payment", "status amount transactionId");
    await auditLogger({
        action: AuditAction.UPDATE,
        collectionName: "Enrollment",
        documentId: enrollmentId,
        performedBy: userId,
        changes: { status },
    });
    return updatedEnrollment;
};
const cancelEnrollment = async (enrollmentId, userId) => {
    const enrollment = await Enrollment.findOne({
        _id: { $eq: new Types.ObjectId(enrollmentId) },
    })
        .populate("user", "name email")
        .populate("payment", "status");
    if (!enrollment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const populatedEnrollment = enrollment;
    if (String(populatedEnrollment.user._id) !== userId) {
        throw new AppError(StatusCodes.FORBIDDEN, "You can only cancel your own enrollments");
    }
    if (enrollment.status !== ENROLLMENT_STATUS.PENDING) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Only pending enrollments can be cancelled");
    }
    const updatedEnrollment = await Enrollment.findOneAndUpdate({ _id: { $eq: new Types.ObjectId(enrollmentId) } }, { status: ENROLLMENT_STATUS.CANCEL }, { returnDocument: "after", runValidators: true });
    await auditLogger({
        action: AuditAction.UPDATE,
        collectionName: "Enrollment",
        documentId: enrollmentId,
        performedBy: userId,
        changes: { status: ENROLLMENT_STATUS.CANCEL },
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
export default EnrollmentService;
