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
const userTokens_1 = require("../../utils/userTokens");
const env_1 = __importDefault(require("../../config/env"));
const passport_1 = __importDefault(require("passport"));
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
const googleCallback = (0, catchAsync_1.default)(async (req, res) => {
    const stateParam = req.query.state;
    let redirectTo = "";
    if (typeof stateParam === "string") {
        redirectTo = stateParam;
    }
    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1);
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
    resetPassword,
    googleCallback,
};
exports.default = AuthControllers;
