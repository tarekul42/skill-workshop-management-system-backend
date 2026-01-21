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
const credentialsLogin = async (payload) => {
    const { email, password } = payload;
    const isUserExists = await user_model_1.default.findOne({ email: { $eq: email } });
    if (!isUserExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User does not exist");
    }
    if (typeof password !== "string" || password.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Valid password is required");
    }
    if (!isUserExists.password) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User password not found");
    }
    const isPasswordMatched = await bcryptjs_1.default.compare(password, isUserExists.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password does not match");
    }
    const userTokens = (0, userTokens_1.createUserTokens)(isUserExists);
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: isUserExists,
    };
};
const getNewAccessToken = async (refreshToken) => {
    const newAccessToken = await (0, userTokens_1.createNewAccessToken)(refreshToken);
    return {
        accessToken: newAccessToken,
    };
};
const AuthServices = {
    credentialsLogin,
    getNewAccessToken,
};
exports.default = AuthServices;
