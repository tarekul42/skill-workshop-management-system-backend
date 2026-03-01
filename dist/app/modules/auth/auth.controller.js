"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const passport_1 = __importDefault(require("passport"));
const env_1 = __importDefault(require("../../config/env"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const setCookie_1 = __importDefault(require("../../utils/setCookie"));
const userTokens_1 = require("../../utils/userTokens");
const auth_service_1 = __importDefault(require("./auth.service"));
const credentialsLogin = (0, catchAsync_1.default)(async (req, res, next) => {
    passport_1.default.authenticate("local", { session: false }, async (err, user, info) => {
        if (err) {
            return next(new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Something went wrong during authentication."));
        }
        if (!user) {
            return next(new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, info?.message || "Incorrect email or password"));
        }
        const userTokens = (0, userTokens_1.createUserTokens)(user);
        (0, setCookie_1.default)(res, userTokens);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "User logged in successfully",
            data: {
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
                user,
            },
        });
    })(req, res, next);
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
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
    });
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
            }
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Logout successful",
        data: null,
    });
});
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user;
    await auth_service_1.default.changePassword(oldPassword, newPassword, decodedToken);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Password changed successfully",
        data: null,
    });
});
const setPassword = (0, catchAsync_1.default)(async (req, res) => {
    const decodedToken = req.user;
    const { password } = req.body;
    await auth_service_1.default.setPassword(decodedToken.userId, password);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Password set successfully",
        data: null,
    });
});
const forgotPassword = (0, catchAsync_1.default)(async (req, res) => {
    const { email } = req.body;
    await auth_service_1.default.forgotPassword(email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Email has been sent",
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
const googleCallback = (0, catchAsync_1.default)(async (req, res) => {
    const stateParam = req.query.state;
    let redirectTo = "";
    if (typeof stateParam === "string") {
        // Normalize backslashes and strip leading slashes for relative path
        const sanitized = stateParam.replace(/\\/g, "/").replace(/^\/+/, "");
        // Reject if it looks like an absolute URL (contains protocol)
        if (!sanitized.includes("://") &&
            !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitized)) {
            redirectTo = sanitized;
        }
    }
    const user = req.user;
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found");
    }
    const tokenInfo = (0, userTokens_1.createUserTokens)(user);
    (0, setCookie_1.default)(res, tokenInfo);
    res.redirect(`${env_1.default.FRONTEND_URL}/${redirectTo}`);
});
const AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout,
    changePassword,
    setPassword,
    forgotPassword,
    resetPassword,
    googleCallback,
};
exports.default = AuthControllers;
