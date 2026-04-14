import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import auditLogger from "../../utils/auditLogger.js";
import logger from "../../utils/logger.js";
import { sendEmailDirect } from "../../utils/sendEmailDirect.js";
import { AuditAction } from "../audit/audit.interface.js";
import { ENROLLMENT_STATUS, } from "../enrollment/enrollment.interface.js";
import SSLService from "../sslCommerz/sslCommerz.service.js";
import { UserRole } from "../user/user.interface.js";
import { WorkShop } from "../workshop/workshop.model.js";
import { PAYMENT_STATUS } from "./payment.interface.js";
import PaymentRepository from "./payment.repository.js";
const initPayment = async (enrollmentId, userId) => {
    if (!enrollmentId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
    }
    const payment = await PaymentRepository.findPaymentByEnrollmentId(enrollmentId);
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (payment.status === PAYMENT_STATUS.PAID) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Payment already completed");
    }
    const enrollment = await PaymentRepository.findEnrollmentWithUser(enrollmentId);
    if (!enrollment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    if (enrollment.status !== ENROLLMENT_STATUS.PENDING) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Enrollment is not pending");
    }
    const populatedEnrollment = enrollment;
    const user = populatedEnrollment.user;
    const enrollmentUser = populatedEnrollment.user;
    if (!enrollmentUser || !enrollmentUser._id) {
        throw new AppError(StatusCodes.NOT_FOUND, "User associated with enrollment not found");
    }
    const enrollmentUserId = String(enrollmentUser._id);
    if (enrollmentUserId !== userId) {
        throw new AppError(StatusCodes.FORBIDDEN, "You can only initiate payment for your own enrollment");
    }
    if (!user?.address || !user?.phone) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User profile is incomplete. Please update address and phone number.");
    }
    const sslPayload = {
        address: user.address,
        email: user.email,
        phoneNumber: user.phone,
        name: user.name,
        amount: payment.amount,
        transactionId: payment.transactionId,
    };
    const sslPayment = await SSLService.sslPaymentInit(sslPayload);
    return {
        paymentUrl: sslPayment.GatewayPageURL,
    };
};
const successPayment = async (query, body) => {
    const transactionId = (query.transactionId || "").trim();
    if (!transactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const val_id = (body.val_id || "").trim();
    if (!val_id) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid val_id");
    }
    // Check if payment is already paid (idempotent — handles race with IPN)
    const existingPayment = await PaymentRepository.findPaymentByTransactionId(transactionId);
    if (!existingPayment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (existingPayment.status === PAYMENT_STATUS.PAID) {
        return {
            success: true,
            message: "Payment already completed",
        };
    }
    // Validate payment with SSLCommerz
    await SSLService.validatePayment({
        val_id,
        tran_id: transactionId,
    });
    // Re-fetch to get paymentGatewayData that was stored during validation
    const paymentWithGatewayData = await PaymentRepository.findPaymentByTransactionId(transactionId);
    if (paymentWithGatewayData?.paymentGatewayData &&
        typeof paymentWithGatewayData.paymentGatewayData === "object") {
        const gatewayData = paymentWithGatewayData.paymentGatewayData;
        // Verify amount from SSLCommerz matches stored amount
        const sslAmount = Number(gatewayData.currency_amount) || Number(gatewayData.amount);
        if (sslAmount && Math.abs(sslAmount - existingPayment.amount) > 0.5) {
            logger.warn({
                msg: "Payment amount mismatch",
                transactionId,
                expectedAmount: existingPayment.amount,
                sslAmount,
            });
            throw new AppError(StatusCodes.BAD_REQUEST, "Payment amount mismatch");
        }
    }
    const session = await PaymentRepository.startTransaction();
    try {
        // Use conditional update: only update if status is still UNPAID
        const updatedPayment = await PaymentRepository.updatePaymentStatus(transactionId, PAYMENT_STATUS.PAID, session);
        if (!updatedPayment) {
            throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
        }
        // If another process already updated this, skip
        if (updatedPayment.status !== PAYMENT_STATUS.PAID) {
            await session.abortTransaction();
            session.endSession();
            return {
                success: true,
                message: "Payment is being processed",
            };
        }
        const updatedEnrollment = await PaymentRepository.updateEnrollmentStatus(String(updatedPayment.enrollment), ENROLLMENT_STATUS.COMPLETE, session);
        if (!updatedEnrollment) {
            throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
        }
        const populatedEnrollment = updatedEnrollment;
        await session.commitTransaction();
        session.endSession();
        await sendEmailDirect({
            to: populatedEnrollment.user.email,
            subject: "Your Enrollment Invoice",
            templateName: "invoice",
            templateData: {
                transactionId: updatedPayment.transactionId,
                enrollmentDate: populatedEnrollment.createdAt,
                userName: populatedEnrollment.user.name,
                workshopTitle: populatedEnrollment.workshop.title,
                studentCount: populatedEnrollment.studentCount,
                totalAmount: updatedPayment.amount,
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
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    // Check current payment status to prevent overwriting a successful IPN
    const existingPayment = await PaymentRepository.findPaymentByTransactionId(transactionId);
    if (!existingPayment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (existingPayment.status !== PAYMENT_STATUS.UNPAID) {
        // Already processed by IPN or another callback — return idempotent response
        return {
            success: false,
            message: "Payment already processed",
        };
    }
    const session = await PaymentRepository.startTransaction();
    try {
        const updatedPayment = await PaymentRepository.updatePaymentStatus(transactionId, PAYMENT_STATUS.FAILED, session);
        if (!updatedPayment) {
            throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
        }
        await PaymentRepository.updateEnrollmentStatus(String(updatedPayment.enrollment), ENROLLMENT_STATUS.FAILED, session);
        await session.commitTransaction();
        session.endSession();
        // Decrement workshop's currentEnrollments after successful commit
        const enrollmentWithWorkshop = await PaymentRepository.findEnrollmentWithUser(String(updatedPayment.enrollment));
        if (enrollmentWithWorkshop?.workshop) {
            await WorkShop.findByIdAndUpdate(enrollmentWithWorkshop.workshop, {
                $inc: { currentEnrollments: -1 },
            });
        }
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
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    // Check current payment status to prevent overwriting a successful IPN
    const existingPayment = await PaymentRepository.findPaymentByTransactionId(transactionId);
    if (!existingPayment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (existingPayment.status !== PAYMENT_STATUS.UNPAID) {
        // Already processed by IPN or another callback — return idempotent response
        return {
            success: false,
            message: "Payment already processed",
        };
    }
    const session = await PaymentRepository.startTransaction();
    try {
        const updatedPayment = await PaymentRepository.updatePaymentStatus(transactionId, PAYMENT_STATUS.CANCELLED, session);
        if (!updatedPayment) {
            throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
        }
        await PaymentRepository.updateEnrollmentStatus(String(updatedPayment.enrollment), ENROLLMENT_STATUS.CANCEL, session);
        await session.commitTransaction();
        session.endSession();
        // Decrement workshop's currentEnrollments after successful commit
        const enrollmentWithWorkshop = await PaymentRepository.findEnrollmentWithUser(String(updatedPayment.enrollment));
        if (enrollmentWithWorkshop?.workshop) {
            await WorkShop.findByIdAndUpdate(enrollmentWithWorkshop.workshop, {
                $inc: { currentEnrollments: -1 },
            });
        }
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
const getInvoiceDownloadUrl = async (paymentId, userId, userRole) => {
    const payment = await PaymentRepository.findPaymentById(paymentId);
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
        const enrollment = await PaymentRepository.findEnrollmentWithUser(String(payment.enrollment));
        if (!enrollment || String(enrollment.user) !== userId) {
            throw new AppError(StatusCodes.FORBIDDEN, "You can only access your own invoices");
        }
    }
    if (!payment.invoiceUrl) {
        throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");
    }
    return payment.invoiceUrl;
};
const handleIPN = async (body) => {
    const transactionId = (body.tran_id || "").trim();
    const status = (body.status || "").trim();
    const valId = (body.val_id || "").trim();
    if (!transactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Missing tran_id in IPN");
    }
    logger.info({
        msg: "IPN received",
        transactionId,
        status,
    });
    // Verify IPN signature and required fields
    SSLService.verifyIPNSignature(body);
    if (status === "VALID") {
        // Validate IPN body contains amount (log warning if missing)
        if (!body.amount && !body.currency_amount) {
            logger.warn({
                msg: "IPN VALID status received without amount field",
                transactionId,
            });
        }
    }
    if (status === "VALID" && valId) {
        await SSLService.validatePayment({ val_id: valId, tran_id: transactionId });
        // Re-fetch payment to get paymentGatewayData stored during validation
        const paymentWithGatewayData = await PaymentRepository.findPaymentByTransactionId(transactionId);
        if (paymentWithGatewayData) {
            // Verify amount from SSLCommerz response matches stored payment amount
            if (paymentWithGatewayData.paymentGatewayData &&
                typeof paymentWithGatewayData.paymentGatewayData === "object") {
                const gatewayData = paymentWithGatewayData.paymentGatewayData;
                const sslAmount = Number(gatewayData.currency_amount) ||
                    Number(gatewayData.amount);
                if (sslAmount &&
                    Math.abs(sslAmount - paymentWithGatewayData.amount) > 0.5) {
                    logger.warn({
                        msg: "IPN amount mismatch",
                        transactionId,
                        expectedAmount: paymentWithGatewayData.amount,
                        sslAmount,
                    });
                    throw new AppError(StatusCodes.BAD_REQUEST, "IPN amount mismatch");
                }
            }
        }
        const session = await PaymentRepository.startTransaction();
        try {
            const updatedPayment = await PaymentRepository.updatePaymentStatus(transactionId, PAYMENT_STATUS.PAID, session);
            if (updatedPayment) {
                await PaymentRepository.updateEnrollmentStatus(String(updatedPayment.enrollment), ENROLLMENT_STATUS.COMPLETE, session);
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
        const session = await PaymentRepository.startTransaction();
        try {
            const updatedPayment = await PaymentRepository.updatePaymentStatus(transactionId, PAYMENT_STATUS.FAILED, session);
            if (updatedPayment) {
                await PaymentRepository.updateEnrollmentStatus(String(updatedPayment.enrollment), ENROLLMENT_STATUS.FAILED, session);
            }
            await session.commitTransaction();
            session.endSession();
            // Decrement workshop's currentEnrollments after successful commit
            if (updatedPayment) {
                const enrollmentWithWorkshop = await PaymentRepository.findEnrollmentWithUser(String(updatedPayment.enrollment));
                if (enrollmentWithWorkshop?.workshop) {
                    await WorkShop.findByIdAndUpdate(enrollmentWithWorkshop.workshop, {
                        $inc: { currentEnrollments: -1 },
                    });
                }
            }
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
    const payment = await PaymentRepository.findPaymentWithEnrollment(paymentId);
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (payment.status !== PAYMENT_STATUS.PAID) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Only paid payments can be refunded");
    }
    const session = await PaymentRepository.startTransaction();
    try {
        const updatedPayment = await PaymentRepository.updatePaymentStatus(payment.transactionId, PAYMENT_STATUS.REFUNDED, session);
        if (updatedPayment) {
            await PaymentRepository.updateEnrollmentStatus(String(updatedPayment.enrollment), ENROLLMENT_STATUS.CANCEL, session);
        }
        await session.commitTransaction();
        session.endSession();
        await auditLogger({
            action: AuditAction.UPDATE,
            collectionName: "Payment",
            documentId: paymentId,
            performedBy: userId,
            changes: { status: PAYMENT_STATUS.REFUNDED, reason },
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
const getPaymentStatus = async (transactionId) => {
    if (!transactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
    }
    const payment = await PaymentRepository.findPaymentByTransactionId(transactionId);
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }
    return {
        status: payment.status,
        transactionId: payment.transactionId,
        amount: payment.amount,
        enrollmentId: payment.enrollment,
    };
};
const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    handleIPN,
    refundPayment,
    getPaymentStatus,
};
export default PaymentService;
