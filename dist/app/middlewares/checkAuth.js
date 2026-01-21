"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = require("../utils/jwt");
const env_1 = __importDefault(require("../config/env"));
const checkAuth = (...authRoles) => async (req, _res, next) => {
    try {
        const accessToken = req.headers.authorization;
        if (!accessToken) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Access token is missing");
        }
        const verifiedToken = (0, jwt_1.verifyToken)(accessToken, env_1.default.JWT_ACCESS_SECRET);
        if (!verifiedToken) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Invalid access token");
        }
        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Access denied");
        }
        req.user = verifiedToken;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.default = checkAuth;
