"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCrudLimiter = exports.strictLimiter = exports.authLimiter = exports.generalLimiter = void 0;
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
const strictLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 429,
        message: "Too many attempts on this sensitive operation, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.strictLimiter = strictLimiter;
const adminCrudLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.adminCrudLimiter = adminCrudLimiter;
