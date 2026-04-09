"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../../config/env"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const logger_1 = __importDefault(require("../../utils/logger"));
const payment_model_1 = __importDefault(require("../payment/payment.model"));
const sslPaymentInit = async (payload) => {
    try {
        const data = {
            store_id: env_1.default.SSL.SSL_STORE_ID,
            store_passwd: env_1.default.SSL.SSL_STORE_PASS,
            total_amount: payload.amount,
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${env_1.default.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
            fail_url: `${env_1.default.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
            cancel_url: `${env_1.default.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
            ipn_url: env_1.default.SSL.SSL_IPN_URL,
            shipping_method: "N/A",
            product_name: "Workshop",
            product_category: "Service",
            product_profile: "general",
            cus_name: payload.name,
            cus_email: payload.email,
            cus_add1: payload.address,
            cus_add2: "N/A",
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: payload.phoneNumber,
            cus_fax: "01711111111",
            ship_name: "N/A",
            ship_add1: "N/A",
            ship_add2: "N/A",
            ship_city: "N/A",
            ship_state: "N/A",
            ship_postcode: 1000,
            ship_country: "N/A",
        };
        // Diagnostic logging for Bug #11 (Environment variable quotes)
        logger_1.default.debug({
            message: "SSL Store ID:",
            val: env_1.default.SSL.SSL_STORE_ID,
        });
        logger_1.default.debug({
            message: "SSL API URL:",
            val: env_1.default.SSL.SSL_PAYMENT_API,
        });
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        const response = await (0, axios_1.default)({
            method: "POST",
            url: env_1.default.SSL.SSL_PAYMENT_API,
            data: formData,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 30000, // 30 seconds
        });
        if (!response.data?.GatewayPageURL) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_GATEWAY, "Invalid response from payment gateway");
        }
        return response.data;
    }
    catch (err) {
        if (err instanceof AppError_1.default) {
            throw err;
        }
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_GATEWAY, errorMessage || "Payment gateway request failed");
    }
};
const validatePayment = async (payload) => {
    try {
        const response = await (0, axios_1.default)({
            method: "GET",
            url: `${env_1.default.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${env_1.default.SSL.SSL_STORE_ID}&store_passwd=${env_1.default.SSL.SSL_STORE_PASS}`,
        });
        logger_1.default.info({
            message: "sslCommerz validate api response",
            data: response.data,
        });
        if (response.data.status !== "VALID" &&
            response.data.status !== "VALIDATED") {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment validation failed");
        }
        await payment_model_1.default.updateOne({ transactionId: { $eq: payload.tran_id } }, { paymentGatewayData: response.data }, { runValidators: true });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error({ message: "Payment validation error", err: error });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_GATEWAY, errorMessage || "Payment validation failed");
    }
};
const SSLService = {
    sslPaymentInit,
    validatePayment,
};
exports.default = SSLService;
