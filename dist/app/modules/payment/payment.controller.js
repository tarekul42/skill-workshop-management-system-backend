"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../../config/env"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const parseParams_1 = require("../../utils/parseParams");
const sslCommerz_service_1 = __importDefault(require("../sslCommerz/sslCommerz.service"));
const payment_service_1 = __importDefault(require("./payment.service"));
const initPayment = (0, catchAsync_1.default)(async (req, res) => {
    const enrollmentId = (0, parseParams_1.parseStringParam)(req.params.enrollmentId, "enrollmentId");
    const result = await payment_service_1.default.initPayment(enrollmentId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Payment initiated successfully",
        data: result,
    });
});
const successPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const body = req.body;
    const result = await payment_service_1.default.successPayment(query, body);
    if (result.success) {
        const params = new URLSearchParams({
            transactionId: String(query.transactionId ?? ""),
            message: result.message ?? "",
            amount: String(query.amount ?? ""),
            status: String(query.status ?? ""),
        });
        res.redirect(`${env_1.default.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`);
    }
    else {
        res.redirect(`${env_1.default.SSL.SSL_FAIL_FRONTEND_URL}?message=${encodeURIComponent(result.message ?? "Payment verification failed")}`);
    }
});
const failPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await payment_service_1.default.failPayment(query);
    const params = new URLSearchParams({
        transactionId: String(query.transactionId ?? ""),
        message: result.message ?? "",
        amount: String(query.amount ?? ""),
        status: String(query.status ?? ""),
    });
    if (!result.success) {
        res.redirect(`${env_1.default.SSL.SSL_FAIL_FRONTEND_URL}?${params.toString()}`);
    }
    else {
        res.redirect(`${env_1.default.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`);
    }
});
const cancelPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await payment_service_1.default.cancelPayment(query);
    const params = new URLSearchParams({
        transactionId: String(query.transactionId ?? ""),
        message: result.message ?? "",
        amount: String(query.amount ?? ""),
        status: String(query.status ?? ""),
    });
    if (!result.success) {
        res.redirect(`${env_1.default.SSL.SSL_CANCEL_FRONTEND_URL}?${params.toString()}`);
    }
    else {
        res.redirect(`${env_1.default.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`);
    }
});
const getInvoiceDownloadUrl = (0, catchAsync_1.default)(async (req, res) => {
    const paymentId = (0, parseParams_1.parseStringParam)(req.params.paymentId, "paymentId");
    const invoiceUrl = await payment_service_1.default.getInvoiceDownloadUrl(paymentId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Invoice URL retrieved successfully",
        data: invoiceUrl,
    });
});
const validatePayment = (0, catchAsync_1.default)(async (req, res) => {
    await sslCommerz_service_1.default.validatePayment(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Payment validated successfully",
        data: null,
    });
});
const handleIPN = (0, catchAsync_1.default)(async (req, res) => {
    const result = await payment_service_1.default.handleIPN(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "IPN processed",
        data: result,
    });
});
const refundPayment = (0, catchAsync_1.default)(async (req, res) => {
    const decodeToken = req.user;
    const { paymentId, reason } = req.body;
    const result = await payment_service_1.default.refundPayment(paymentId, decodeToken.userId, reason);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: null,
    });
});
const PaymentController = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    validatePayment,
    handleIPN,
    refundPayment,
};
exports.default = PaymentController;
