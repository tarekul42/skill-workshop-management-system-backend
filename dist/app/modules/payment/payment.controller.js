import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import catchAsync from "../../utils/catchAsync";
import { parseStringParam } from "../../utils/parseParams";
import sendResponse from "../../utils/sendResponse";
import SSLService from "../sslCommerz/sslCommerz.service";
import PaymentService from "./payment.service";
const initPayment = catchAsync(async (req, res) => {
    const enrollmentId = parseStringParam(req.params.enrollmentId, "enrollmentId");
    const result = await PaymentService.initPayment(enrollmentId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment initiated successfully",
        data: result,
    });
});
const successPayment = catchAsync(async (req, res) => {
    const query = req.query;
    const body = req.body;
    const result = await PaymentService.successPayment(query, body);
    if (result.success) {
        const params = new URLSearchParams({
            transactionId: String(query.transactionId ?? ""),
            message: result.message ?? "",
            amount: String(query.amount ?? ""),
            status: String(query.status ?? ""),
        });
        res.redirect(`${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`);
    }
    else {
        res.redirect(`${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?message=${encodeURIComponent(result.message ?? "Payment verification failed")}`);
    }
});
const failPayment = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await PaymentService.failPayment(query);
    const params = new URLSearchParams({
        transactionId: String(query.transactionId ?? ""),
        message: result.message ?? "",
        amount: String(query.amount ?? ""),
        status: String(query.status ?? ""),
    });
    if (!result.success) {
        res.redirect(`${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?${params.toString()}`);
    }
    else {
        res.redirect(`${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`);
    }
});
const cancelPayment = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await PaymentService.cancelPayment(query);
    const params = new URLSearchParams({
        transactionId: String(query.transactionId ?? ""),
        message: result.message ?? "",
        amount: String(query.amount ?? ""),
        status: String(query.status ?? ""),
    });
    if (!result.success) {
        res.redirect(`${envVariables.SSL.SSL_CANCEL_FRONTEND_URL}?${params.toString()}`);
    }
    else {
        res.redirect(`${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`);
    }
});
const getInvoiceDownloadUrl = catchAsync(async (req, res) => {
    const paymentId = parseStringParam(req.params.paymentId, "paymentId");
    const invoiceUrl = await PaymentService.getInvoiceDownloadUrl(paymentId);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Invoice URL retrieved successfully",
        data: invoiceUrl,
    });
});
const validatePayment = catchAsync(async (req, res) => {
    await SSLService.validatePayment(req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Payment validated successfully",
        data: null,
    });
});
const handleIPN = catchAsync(async (req, res) => {
    const result = await PaymentService.handleIPN(req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "IPN processed",
        data: result,
    });
});
const refundPayment = catchAsync(async (req, res) => {
    const decodeToken = req.user;
    const { paymentId, reason } = req.body;
    const result = await PaymentService.refundPayment(paymentId, decodeToken.userId, reason);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
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
export default PaymentController;
