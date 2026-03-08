"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.generalLimiter = exports.authLimiter = exports.adminCrudLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_config_1 = require("../config/redis.config");
const commonOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    store: new rate_limit_redis_1.RedisStore({
        sendCommand: (...args) => redis_config_1.redisClient.sendCommand(args),
    }),
};
const generalLimiter = (0, express_rate_limit_1.rateLimit)({
    ...commonOptions,
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
});
exports.generalLimiter = generalLimiter;
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        status: 429,
        message: "Too many attempts, please try again later.",
    },
});
exports.authLimiter = authLimiter;
const strictLimiter = (0, express_rate_limit_1.rateLimit)({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 429,
        message: "Too many attempts on this sensitive operation, please try again later.",
    },
});
exports.strictLimiter = strictLimiter;
const adminCrudLimiter = (0, express_rate_limit_1.rateLimit)({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
});
exports.adminCrudLimiter = adminCrudLimiter;
