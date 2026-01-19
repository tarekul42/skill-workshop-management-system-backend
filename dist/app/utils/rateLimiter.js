"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const generalLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
});
exports.generalLimiter = generalLimiter;
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        status: 429,
        message: "Too many attempts, please try again later.",
    },
});
exports.authLimiter = authLimiter;
