"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../config/env"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const jwt_1 = require("../utils/jwt");
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
        const isUserExists = await user_model_1.default.findOne({ email: verifiedToken.email });
        if (!isUserExists) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User does not exist");
        }
        if (isUserExists.isActive === user_interface_1.IsActive.INACTIVE ||
            isUserExists.isActive === user_interface_1.IsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `User is ${isUserExists.isActive.toLowerCase()}.`);
        }
        if (isUserExists.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User is deleted");
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
