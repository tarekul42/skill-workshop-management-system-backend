"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const env_1 = __importDefault(require("../config/env"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const handleCastError_1 = __importDefault(require("../helpers/handleCastError"));
const handleDuplicateError_1 = __importDefault(require("../helpers/handleDuplicateError"));
const handleValidationError_1 = __importDefault(require("../helpers/handleValidationError"));
const handleZodError_1 = __importDefault(require("../helpers/handleZodError"));
const logger_1 = __importDefault(require("../utils/logger"));
const globalErrorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    logger_1.default.error(err, "Global error caught");
    let statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong!!!";
    let errorSources = [];
    if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof zod_1.ZodError) {
        const simplifiedError = (0, handleZodError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    else if (err instanceof mongoose_1.default.Error.CastError) {
        const simplifiedError = (0, handleCastError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
    }
    else if (err instanceof mongoose_1.default.Error.ValidationError) {
        const simplifiedError = (0, handleValidationError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    else if (err instanceof Error) {
        const errorObj = err;
        const errName = errorObj.name || "";
        const errMessage = errorObj.message || "";
        if (errName === "MulterError" ||
            errMessage.includes("Invalid file type") ||
            errMessage.includes("Unexpected field") ||
            errMessage.includes("Invalid image file")) {
            statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
            message = errMessage;
        }
        else if (errorObj.code === "EBADCSRFTOKEN") {
            statusCode = http_status_codes_1.StatusCodes.FORBIDDEN;
            message =
                "Invalid CSRF token. Please ensure you have fetched a new token and included it in the 'x-csrf-token' header.";
        }
        else if (errorObj.code === 11000) {
            const simplifiedError = (0, handleDuplicateError_1.default)(err);
            statusCode = simplifiedError.statusCode;
            message = simplifiedError.message;
        }
        else {
            message = err.message || "Something went wrong!!!";
        }
    }
    const responseBody = {
        success: false,
        message,
        errorSources,
    };
    if (env_1.default.NODE_ENV === "development") {
        responseBody.err =
            err instanceof Error
                ? { name: err.name, message: err.message }
                : { message: String(err) };
        responseBody.stack = err instanceof Error ? err.stack : null;
    }
    res.status(statusCode).json(responseBody);
};
exports.default = globalErrorHandler;
