"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const handleCastError = (err) => {
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: `Invalid MongoDB ObjectId. Please provide a valid ObjectId. Err: ${err.message}`,
    };
};
exports.default = handleCastError;
