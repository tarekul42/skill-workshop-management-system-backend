"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const handleZodError = (err) => {
    const errorSources = err.issues.map((issue) => ({
        // Explicitly convert the value to a string to handle array indices (numbers)
        // and satisfy the 'string' type requirement of IErrorSources.
        path: String(issue.path[issue.path.length - 1] ?? "value"),
        message: issue.message,
    }));
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: "Zod validation error",
        errorSources,
    };
};
exports.default = handleZodError;
