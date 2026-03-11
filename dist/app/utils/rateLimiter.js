"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.generalLimiter = exports.authLimiter = exports.adminCrudLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_config_1 = require("../config/redis.config");
const createLimiter = (prefix, windowMs, max, message) => {
    return (0, express_rate_limit_1.rateLimit)({
        standardHeaders: true,
        legacyHeaders: false,
        store: new rate_limit_redis_1.RedisStore({
            sendCommand: async (...args) => {
                if (!redis_config_1.redisClient.isOpen) {
                    await redis_config_1.redisClient.connect();
                }
                return redis_config_1.redisClient.sendCommand(args);
            },
            prefix,
        }),
        windowMs,
        max,
        message,
    });
};
// Rate limiters for production
const generalLimiter = createLimiter("rl:general:", 1 * 60 * 1000, 60, {
    status: 429,
    message: "Too many requests, please try again later.",
});
exports.generalLimiter = generalLimiter;
const authLimiter = createLimiter("rl:auth:", 15 * 60 * 1000, 10, {
    status: 429,
    message: "Too many attempts, please try again later.",
});
exports.authLimiter = authLimiter;
const strictLimiter = createLimiter("rl:strict:", 15 * 60 * 1000, 5, {
    status: 429,
    message: "Too many attempts on this sensitive operation, please try again later.",
});
exports.strictLimiter = strictLimiter;
const adminCrudLimiter = createLimiter("rl:admin:", 15 * 60 * 1000, 30, {
    status: 429,
    message: "Too many requests, please try again later.",
});
exports.adminCrudLimiter = adminCrudLimiter;
