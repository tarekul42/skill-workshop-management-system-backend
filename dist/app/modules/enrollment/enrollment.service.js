"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const getTransactionId_1 = require("../../utils/getTransactionId");
const payment_interface_1 = require("../payment/payment.interface");
const payment_model_1 = __importDefault(require("../payment/payment.model"));
const sslCommerz_service_1 = __importDefault(require("../sslCommerz/sslCommerz.service"));
const user_model_1 = __importDefault(require("../user/user.model"));
const workshop_model_1 = require("../workshop/workshop.model");
const enrollment_interface_1 = require("./enrollment.interface");
const enrollment_model_1 = __importDefault(require("./enrollment.model"));
const createEnrollment = async (payload, userId) => {
    const transactionId = (0, getTransactionId_1.getTransactionId)();
    const session = await enrollment_model_1.default.startSession();
    session.startTransaction();
    try {
        if (!payload.workshop) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop ID is required.");
        }
        if (typeof payload.workshop !== "string") {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop ID must be a string.");
        }
        const workshopId = payload.workshop;
        const user = await user_model_1.default.findById(userId).session(session);
        if (!user?.phone || !user.address) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please update your profile to Enroll in a Workshop.");
        }
        const workshop = await workshop_model_1.WorkShop.findById(workshopId)
            .select("price")
            .session(session);
        if (!workshop) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Workshop not found.");
        }
        if (workshop.price == null) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop price is not set.");
        }
        if (!payload.studentCount || payload.studentCount <= 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Student count must be a positive number.");
        }
        const amount = Number(workshop.price) * Number(payload.studentCount);
        if (isNaN(amount) || amount <= 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid enrollment amount calculated.");
        }
        const enrollment = await enrollment_model_1.default.create([
            {
                ...payload,
                user: userId,
                status: enrollment_interface_1.ENROLLMENT_STATUS.PENDING,
            },
        ], { session });
        const payment = await payment_model_1.default.create([
            {
                enrollment: enrollment[0]._id,
                status: payment_interface_1.PAYMENT_STATUS.UNPAID,
                transactionId: transactionId,
                amount: amount,
            },
        ], { session });
        const updatedEnrollment = await enrollment_model_1.default.findByIdAndUpdate(enrollment[0]._id, {
            payment: payment[0]._id,
        }, { new: true, runValidators: true, session })
            .populate("user", "name email phone address")
            .populate("workshop", "title price")
            .populate("payment");
        const userAddress = (updatedEnrollment?.user).address;
        const userEmail = (updatedEnrollment?.user).email;
        const userPhoneNumber = (updatedEnrollment?.user).phone;
        const userName = (updatedEnrollment?.user).name;
        const sslPayload = {
            address: userAddress,
            email: userEmail,
            phoneNumber: userPhoneNumber,
            name: userName,
            amount: amount,
            transactionId: transactionId,
        };
        const sslPayment = await sslCommerz_service_1.default.sslPaymentInit(sslPayload);
        await session.commitTransaction();
        session.endSession();
        return {
            paymentUrl: sslPayment.GatewayPageURL,
            enrollment: updatedEnrollment,
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
    const enrollment = await enrollment_model_1.default.findById(enrollmentId)
        .populate("user", "name email phone address")
        .populate("workshop", "title price images location startDate endDate")
        .populate("payment", "status amount transactionId invoiceUrl");
    if (!enrollment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const isOwner = enrollment.user && enrollment.user._id?.toString() === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to view this enrollment");
    }
    return {
        data: enrollment,
    };
};
const getAllEnrollments = async (query) => {
    const { status, page = 1, limit = 10 } = query;
    const filter = {};
    if (typeof status === "string") {
        const allowedStatuses = Object.values(enrollment_interface_1.ENROLLMENT_STATUS);
        if (allowedStatuses.includes(status)) {
            filter.status = status;
        }
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
    const enrollment = await enrollment_model_1.default.findById(enrollmentId);
    if (!enrollment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    const updatedEnrollment = await enrollment_model_1.default.findByIdAndUpdate(enrollmentId, { status }, { new: true, runValidators: true })
        .populate("user", "name email phone")
        .populate("workshop", "title price")
        .populate("payment", "status amount transactionId");
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
