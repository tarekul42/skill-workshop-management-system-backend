"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const mail_queue_1 = require("../../jobs/mail.queue");
const enrollment_interface_1 = require("../enrollment/enrollment.interface");
const sslCommerz_service_1 = __importDefault(require("../sslCommerz/sslCommerz.service"));
const payment_interface_1 = require("./payment.interface");
const payment_repository_1 = __importDefault(require("./payment.repository"));
const initPayment = async (enrollmentId) => {
    if (!enrollmentId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
    }
    const payment = await payment_repository_1.default.findPaymentByEnrollmentId(enrollmentId);
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.PAID) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment already completed");
    }
    const enrollment = await payment_repository_1.default.findEnrollmentWithUser(enrollmentId);
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
const successPayment = async (query, body) => {
    const transactionId = (query.transactionId || "").trim();
    if (!transactionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const val_id = (body.val_id || "").trim();
    if (!val_id) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid val_id");
    }
    await sslCommerz_service_1.default.validatePayment({
        val_id,
        tran_id: transactionId,
    });
    const session = await payment_repository_1.default.startTransaction();
    try {
        const updatedPayment = await payment_repository_1.default.updatePaymentStatus(transactionId, payment_interface_1.PAYMENT_STATUS.PAID, session);
        if (!updatedPayment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
        }
        const updatedEnrollment = await payment_repository_1.default.updateEnrollmentStatus(String(updatedPayment.enrollment), enrollment_interface_1.ENROLLMENT_STATUS.COMPLETE, session);
        if (!updatedEnrollment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
        }
        await session.commitTransaction();
        session.endSession();
        await mail_queue_1.mailQueue.add("invoice", {
            type: "invoice",
            payload: {
                to: updatedEnrollment.user.email,
                transactionId: updatedPayment.transactionId,
                enrollmentDate: updatedEnrollment.createdAt,
                userName: updatedEnrollment.user.name,
                workshopTitle: updatedEnrollment.workshop
                    .title,
                studentCount: updatedEnrollment.studentCount,
                totalAmount: updatedPayment.amount,
                email: updatedEnrollment.user.email,
            },
        });
        return {
            success: true,
            message: "Payment completed successfully",
        };
    }
    catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        throw err;
    }
};
const failPayment = async (query) => {
    const transactionId = (query.transactionId || "").trim();
    if (!transactionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const session = await payment_repository_1.default.startTransaction();
    try {
        const updatedPayment = await payment_repository_1.default.updatePaymentStatus(transactionId, payment_interface_1.PAYMENT_STATUS.FAILED, session);
        if (!updatedPayment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
        }
        await payment_repository_1.default.updateEnrollmentStatus(String(updatedPayment.enrollment), enrollment_interface_1.ENROLLMENT_STATUS.FAILED, session);
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
    const transactionId = (query.transactionId || "").trim();
    if (!transactionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const session = await payment_repository_1.default.startTransaction();
    try {
        const updatedPayment = await payment_repository_1.default.updatePaymentStatus(transactionId, payment_interface_1.PAYMENT_STATUS.CANCELLED, session);
        if (!updatedPayment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
        }
        await payment_repository_1.default.updateEnrollmentStatus(String(updatedPayment.enrollment), enrollment_interface_1.ENROLLMENT_STATUS.CANCEL, session);
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
const getInvoiceDownloadUrl = async (paymentId) => {
    const payment = await payment_repository_1.default.findPaymentById(paymentId);
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (!payment.invoiceUrl) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Invoice not found");
    }
    return payment.invoiceUrl;
};
const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
};
exports.default = PaymentService;
