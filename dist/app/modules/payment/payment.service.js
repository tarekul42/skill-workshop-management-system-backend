"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const mail_queue_1 = require("../../jobs/mail.queue");
const auditLogger_1 = __importDefault(require("../../utils/auditLogger"));
const logger_1 = __importDefault(require("../../utils/logger"));
const audit_interface_1 = require("../audit/audit.interface");
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
    const populatedEnrollment = enrollment;
    const user = populatedEnrollment.user;
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
        const populatedEnrollment = updatedEnrollment;
        await session.commitTransaction();
        session.endSession();
        await mail_queue_1.mailQueue.add("invoice", {
            type: "invoice",
            payload: {
                to: populatedEnrollment.user.email,
                transactionId: updatedPayment.transactionId,
                enrollmentDate: populatedEnrollment.createdAt,
                userName: populatedEnrollment.user.name,
                workshopTitle: populatedEnrollment.workshop.title,
                studentCount: populatedEnrollment.studentCount,
                totalAmount: updatedPayment.amount,
                email: populatedEnrollment.user.email,
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
const handleIPN = async (body) => {
    const transactionId = (body.tran_id || "").trim();
    const status = (body.status || "").trim();
    const valId = (body.val_id || "").trim();
    if (!transactionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Missing tran_id in IPN");
    }
    logger_1.default.info({
        message: "IPN received",
        transactionId,
        status,
    });
    if (status === "VALID" && valId) {
        await sslCommerz_service_1.default.validatePayment({ val_id: valId, tran_id: transactionId });
        const session = await payment_repository_1.default.startTransaction();
        try {
            const updatedPayment = await payment_repository_1.default.updatePaymentStatus(transactionId, payment_interface_1.PAYMENT_STATUS.PAID, session);
            if (updatedPayment) {
                await payment_repository_1.default.updateEnrollmentStatus(String(updatedPayment.enrollment), enrollment_interface_1.ENROLLMENT_STATUS.COMPLETE, session);
            }
            await session.commitTransaction();
            session.endSession();
        }
        catch (err) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();
            throw err;
        }
    }
    else if (status === "FAILED") {
        const session = await payment_repository_1.default.startTransaction();
        try {
            const updatedPayment = await payment_repository_1.default.updatePaymentStatus(transactionId, payment_interface_1.PAYMENT_STATUS.FAILED, session);
            if (updatedPayment) {
                await payment_repository_1.default.updateEnrollmentStatus(String(updatedPayment.enrollment), enrollment_interface_1.ENROLLMENT_STATUS.FAILED, session);
            }
            await session.commitTransaction();
            session.endSession();
        }
        catch (err) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();
            throw err;
        }
    }
    return { received: true };
};
const refundPayment = async (paymentId, userId, reason) => {
    const payment = await payment_repository_1.default.findPaymentWithEnrollment(paymentId);
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (payment.status !== payment_interface_1.PAYMENT_STATUS.PAID) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Only paid payments can be refunded");
    }
    const session = await payment_repository_1.default.startTransaction();
    try {
        const updatedPayment = await payment_repository_1.default.updatePaymentStatus(payment.transactionId, payment_interface_1.PAYMENT_STATUS.REFUNDED, session);
        if (updatedPayment) {
            await payment_repository_1.default.updateEnrollmentStatus(String(updatedPayment.enrollment), enrollment_interface_1.ENROLLMENT_STATUS.CANCEL, session);
        }
        await session.commitTransaction();
        session.endSession();
        await (0, auditLogger_1.default)({
            action: audit_interface_1.AuditAction.UPDATE,
            collectionName: "Payment",
            documentId: paymentId,
            performedBy: userId,
            changes: { status: payment_interface_1.PAYMENT_STATUS.REFUNDED, reason },
        });
        return {
            success: true,
            message: "Payment refunded successfully",
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
const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    handleIPN,
    refundPayment,
};
exports.default = PaymentService;
