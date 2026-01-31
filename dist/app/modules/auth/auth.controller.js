"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const auth_service_1 = __importDefault(require("./auth.service"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const setCookie_1 = __importDefault(require("../../utils/setCookie"));
const creadentialsLogin = (0, catchAsync_1.default)(async (req, res) => {
    const loginInfo = await auth_service_1.default.credentialsLogin(req.body);
    (0, setCookie_1.default)(res, loginInfo);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Login successful",
        data: loginInfo,
    });
});
const getNewAccessToken = (0, catchAsync_1.default)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No refresh token found");
    }
    const tokenInfo = await auth_service_1.default.getNewAccessToken(refreshToken);
    (0, setCookie_1.default)(res, tokenInfo);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "New access token generated successfully",
        data: tokenInfo,
    });
});
const logout = (0, catchAsync_1.default)(async (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Logout successful",
        data: null,
    });
});
const resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const decodedToken = req.user;
    await auth_service_1.default.resetPassword(oldPassword, newPassword, decodedToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Password reset successful",
        data: null,
    });
});
const AuthControllers = {
    creadentialsLogin,
    getNewAccessToken,
    logout,
    resetPassword,
};
exports.default = AuthControllers;
