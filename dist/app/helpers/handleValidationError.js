"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const handleValidationError = (err) => {
    const errorSources = [];
    const errors = Object.values(err.errors);
    errors.forEach((errorObject) => errorSources.push({
        path: errorObject.path,
        message: errorObject.message,
    }));
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: "Validation Error Occurred",
        errorSources,
    };
};
exports.default = handleValidationError;
