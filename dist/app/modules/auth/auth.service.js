"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = __importDefault(require("../user/user.model"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userTokens_1 = require("../../utils/userTokens");
const env_1 = __importDefault(require("../../config/env"));
const getNewAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No refresh token found");
    }
    const newAccessToken = await (0, userTokens_1.createNewAccessToken)(refreshToken);
    return {
        accessToken: newAccessToken,
    };
};
const resetPassword = async (oldPassword, newPassword, decodedToken) => {
    const user = await user_model_1.default.findById(decodedToken.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (oldPassword === newPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password cannot be the same as the old password");
    }
    const isOldPasswordMatched = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isOldPasswordMatched) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Old password does not match");
    }
    user.password = await bcryptjs_1.default.hash(newPassword, Number(env_1.default.BCRYPT_SALT_ROUND));
    user.save();
};
const AuthServices = {
    getNewAccessToken,
    resetPassword,
};
exports.default = AuthServices;
