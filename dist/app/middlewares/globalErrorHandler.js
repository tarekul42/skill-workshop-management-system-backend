"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../config/env"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const handleCastError_1 = __importDefault(require("../helpers/handleCastError"));
const handleDuplicateError_1 = __importDefault(require("../helpers/handleDuplicateError"));
const handleValidationError_1 = __importDefault(require("../helpers/handleValidationError"));
const handleZodError_1 = __importDefault(require("../helpers/handleZodError"));
const globalErrorHandler = (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    if (env_1.default.NODE_ENV === "development") {
        console.log(err);
    }
    let statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    let message = `Something went wrong!!! ${err.message}`;
    let errorSources = [];
    if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof Error) {
        statusCode = 500;
        message = err.message;
    }
    else if (err.code === 11000) {
        const simplifiedError = (0, handleDuplicateError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
    }
    else if (err.name === "CastError") {
        const simplifiedError = (0, handleCastError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
    }
    else if (err.name === "ZodError") {
        const simplifiedError = (0, handleZodError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    else if (err.name === "ValidationError") {
        const simplifiedError = (0, handleValidationError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err: env_1.default.NODE_ENV === "development" ? err : null,
        stack: env_1.default.NODE_ENV === "development" ? err?.stack : null,
    });
};
exports.default = globalErrorHandler;
