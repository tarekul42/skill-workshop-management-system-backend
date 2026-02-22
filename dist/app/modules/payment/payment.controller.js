"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../../config/env"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const payment_service_1 = __importDefault(require("./payment.service"));
const initPayment = (0, catchAsync_1.default)(async (req, res) => {
    const enrollmentId = req.params.enrollmentId;
    const result = await payment_service_1.default.initPayment(enrollmentId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Payment initiated successfully",
        data: result,
    });
});
const successPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await payment_service_1.default.successPayment(query);
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
const PaymentController = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
};
exports.default = PaymentController;
