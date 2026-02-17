"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const handleDuplicateError = (err) => {
    const matchedArray = err.message.match(/"([^"]*)"/);
    const fieldName = matchedArray ? matchedArray[1] : "field";
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: `Duplicate key error. Please provide a unique value for ${fieldName}. Err: ${err.message}`,
    };
};
exports.default = handleDuplicateError;
