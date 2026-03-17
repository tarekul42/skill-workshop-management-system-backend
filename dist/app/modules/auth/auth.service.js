"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = __importDefault(require("validator"));
const env_1 = __importDefault(require("../../config/env"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const mail_queue_1 = require("../../jobs/mail.queue");
const userTokens_1 = require("../../utils/userTokens");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = __importDefault(require("../user/user.model"));
const getNewAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No refresh token found");
    }
    const tokens = await (0, userTokens_1.createNewAccessToken)(refreshToken);
    return tokens;
};
const changePassword = async (oldPassword, newPassword, decodedToken) => {
    const user = await user_model_1.default.findById(decodedToken.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (oldPassword === newPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password cannot be the same as the old password");
    }
    if (!user.password) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No password set for this account");
    }
    const isOldPasswordMatched = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isOldPasswordMatched) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid old password");
    }
    user.password = await bcryptjs_1.default.hash(newPassword, Number(env_1.default.BCRYPT_SALT_ROUND));
    await user.save();
};
const setPassword = async (userId, plainPassword) => {
    const user = await user_model_1.default.findById(userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    if (user.password &&
        user.auths.some((providerObject) => providerObject.provider === "google")) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Cannot change password for Google users");
    }
    const hashedPassword = await bcryptjs_1.default.hash(plainPassword, Number(env_1.default.BCRYPT_SALT_ROUND));
    const credentialProvider = {
        provider: "credentials",
        providerId: user.email,
    };
    const hasCredentials = user.auths.some((providerObject) => providerObject.provider === "credentials");
    const auths = hasCredentials
        ? user.auths
        : [...user.auths, credentialProvider];
    user.password = hashedPassword;
    user.auths = auths;
    await user.save();
};
const forgotPassword = async (email) => {
    if (typeof email !== "string") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid email");
    }
    if (email.length > 254) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid email length");
    }
    if (!validator_1.default.isEmail(email)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid email format");
    }
    const isUserExists = await user_model_1.default.findOne({ email: { $eq: email } });
    if (!isUserExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (!isUserExists.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User is not verified");
    }
    if (isUserExists.isActive === user_interface_1.IsActive.BLOCKED ||
        isUserExists.isActive === user_interface_1.IsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User is blocked or inactive");
    }
    if (isUserExists.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User is deleted");
    }
    const jwtPayload = {
        userId: isUserExists._id,
        email: isUserExists.email,
        role: isUserExists.role,
    };
    const resetToken = jsonwebtoken_1.default.sign(jwtPayload, env_1.default.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
    const resetUILink = `${env_1.default.FRONTEND_URL}/reset-password?id=${isUserExists._id}&token=${resetToken}`;
    await mail_queue_1.mailQueue.add("forgot-password", {
        type: "forgot-password",
        payload: {
            email: isUserExists.email,
            name: isUserExists.name,
            resetUILink,
        },
    });
};
const resetPassword = async (newPassword, decodedToken) => {
    const user = await user_model_1.default.findById(decodedToken.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    user.password = await bcryptjs_1.default.hash(newPassword, Number(env_1.default.BCRYPT_SALT_ROUND));
    await user.save();
};
const AuthServices = {
    getNewAccessToken,
    changePassword,
    setPassword,
    forgotPassword,
    resetPassword,
};
exports.default = AuthServices;
