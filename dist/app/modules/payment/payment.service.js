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
const invoice_1 = require("../../utils/invoice");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const sendEmail_1 = __importDefault(require("../../utils/sendEmail"));
const initPayment = async (enrollmentId) => {
    if (!enrollmentId || !mongoose_1.Types.ObjectId.isValid(enrollmentId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
    }
    const payment = await payment_model_1.default.findOne({
        enrollment: { $eq: new mongoose_1.Types.ObjectId(enrollmentId) },
    });
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment not found");
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.PAID) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment already completed");
    }
    const enrollment = await enrollment_model_1.default.findOne({
        _id: { $eq: new mongoose_1.Types.ObjectId(payment.enrollment) },
    }).populate("user", "name email phone address");
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
        const updatedEnrollment = await enrollment_model_1.default.findOneAndUpdate({ _id: { $eq: new mongoose_1.Types.ObjectId(updatedPayment.enrollment) } }, { status: enrollment_interface_1.ENROLLMENT_STATUS.COMPLETE }, { new: true, runValidators: true, session })
            .populate("workshop", "title")
            .populate("user", "name email");
        if (!updatedEnrollment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Enrollment not found");
        }
        await session.commitTransaction();
        session.endSession();
        // Post-transaction processing: Invoice generation, Cloudinary upload, and Email notification
        try {
            const invoiceData = {
                transactionId: updatedPayment.transactionId,
                enrollmentDate: updatedEnrollment.createdAt,
                userName: updatedEnrollment.user.name,
                workshopTitle: updatedEnrollment.workshop.title,
                studentCount: updatedEnrollment.studentCount,
                totalAmount: updatedPayment.amount,
            };
            const pdfBuffer = await (0, invoice_1.generatePDF)(invoiceData);
            const cloudinaryResult = await (0, cloudinary_config_1.uploadBufferToCloudinary)(pdfBuffer, "invoice");
            if (cloudinaryResult) {
                await payment_model_1.default.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true });
            }
            await (0, sendEmail_1.default)({
                to: updatedEnrollment.user.email,
                subject: "Your Enrollment Invoice",
                templateName: "invoice",
                templateData: invoiceData,
                attachments: [
                    {
                        filename: "invoice.pdf",
                        content: pdfBuffer,
                        contentType: "application/pdf",
                    },
                ],
            });
        }
        catch (postError) {
            // Log error but don't fail the response since payment was successful
            // eslint-disable-next-line no-console
            console.error("Error in post-payment processing:", postError);
        }
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
const getInvoiceDownloadUrl = async (paymentId) => {
    if (!paymentId || !mongoose_1.Types.ObjectId.isValid(paymentId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid payment ID");
    }
    const payment = await payment_model_1.default.findById(paymentId).select("invoiceUrl");
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
