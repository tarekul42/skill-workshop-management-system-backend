"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const enrollment_interface_1 = require("../enrollment/enrollment.interface");
const enrollment_model_1 = __importDefault(require("../enrollment/enrollment.model"));
const sslCommerz_service_1 = __importDefault(require("../sslCommerz/sslCommerz.service"));
const payment_interface_1 = require("./payment.interface");
const payment_model_1 = __importDefault(require("./payment.model"));
const initPayment = async (enrollmentId) => {
    if (!enrollmentId || !mongoose_1.Types.ObjectId.isValid(enrollmentId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
    }
    const payment = await payment_model_1.default.findOne({ enrollment: enrollmentId });
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.PAID) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment already completed");
    }
    const enrollment = await enrollment_model_1.default.findById(payment.enrollment).populate("user", "name email phone address");
    if (!enrollment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    if (enrollment.status !== enrollment_interface_1.ENROLLMENT_STATUS.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Enrollment is not pending");
    }
    const user = enrollment.user;
    if (!user?.address || !user?.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User profile is incomplete. Please update address and phone number.");
    }
    const sslPayload = {
        address: user.address,
        email: user.email,
        phoneNumber: user.phone,
        name: user.name,
        amount: payment.amount,
        transactionId: payment.transactionId,
    };
    const sslPayment = await sslCommerz_service_1.default.sslPaymentInit(sslPayload);
    return {
        paymentUrl: sslPayment.GatewayPageURL,
    };
};
const successPayment = async (query) => {
    const rawTransactionId = query.transactionId;
    if (typeof rawTransactionId !== "string" || !rawTransactionId.trim()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const transactionId = rawTransactionId.trim();
    const session = await enrollment_model_1.default.startSession();
    session.startTransaction();
    try {
        const updatedPayment = await payment_model_1.default.findOneAndUpdate({ transactionId: { $eq: transactionId } }, { status: payment_interface_1.PAYMENT_STATUS.PAID }, { new: true, runValidators: true, session });
        if (!updatedPayment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
        }
        await enrollment_model_1.default.findByIdAndUpdate(updatedPayment.enrollment, { status: enrollment_interface_1.ENROLLMENT_STATUS.COMPLETE }, { runValidators: true, session });
        await session.commitTransaction();
        session.endSession();
        return {
            success: true,
            message: "Payment completed successfully",
        };
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
const failPayment = async (query) => {
    const rawTransactionId = query.transactionId;
    if (typeof rawTransactionId !== "string" || !rawTransactionId.trim()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const transactionId = rawTransactionId.trim();
    const session = await enrollment_model_1.default.startSession();
    session.startTransaction();
    try {
        const updatedPayment = await payment_model_1.default.findOneAndUpdate({ transactionId: { $eq: transactionId } }, { status: payment_interface_1.PAYMENT_STATUS.FAILED }, { new: true, runValidators: true, session });
        if (!updatedPayment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
        }
        await enrollment_model_1.default.findByIdAndUpdate(updatedPayment.enrollment, { status: enrollment_interface_1.ENROLLMENT_STATUS.FAILED }, { runValidators: true, session });
        await session.commitTransaction();
        session.endSession();
        return {
            success: false,
            message: "Payment Failed",
        };
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
const cancelPayment = async (query) => {
    const rawTransactionId = query.transactionId;
    if (typeof rawTransactionId !== "string" || !rawTransactionId.trim()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const transactionId = rawTransactionId.trim();
    const session = await enrollment_model_1.default.startSession();
    session.startTransaction();
    try {
        const updatedPayment = await payment_model_1.default.findOneAndUpdate({ transactionId: { $eq: transactionId } }, { status: payment_interface_1.PAYMENT_STATUS.CANCELLED }, { new: true, runValidators: true, session });
        if (!updatedPayment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
        }
        await enrollment_model_1.default.findByIdAndUpdate(updatedPayment.enrollment, { status: enrollment_interface_1.ENROLLMENT_STATUS.CANCEL }, { runValidators: true, session });
        await session.commitTransaction();
        session.endSession();
        return {
            success: false,
            message: "Payment Cancelled",
        };
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
};
exports.default = PaymentService;
