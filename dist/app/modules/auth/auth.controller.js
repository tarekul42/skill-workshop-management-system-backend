import { StatusCodes } from "http-status-codes";
import passport from "passport";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import catchAsync from "../../utils/catchAsync";
import logger from "../../utils/logger";
import sendResponse from "../../utils/sendResponse";
import setAuthCookie from "../../utils/setCookie";
import { invalidateToken } from "../../utils/tokenBlacklist";
import { createUserTokens } from "../../utils/userTokens";
import AuthServices from "./auth.service";
const credentialsLogin = catchAsync(async (req, res, next) => {
    passport.authenticate("local", { session: false }, async (err, user, info) => {
        if (err) {
            return next(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Something went wrong during authentication."));
        }
        if (!user) {
            return next(new AppError(StatusCodes.UNAUTHORIZED, info?.message || "Incorrect email or password"));
        }
        const userTokens = await createUserTokens(user);
        setAuthCookie(res, userTokens);
        sendResponse(res, {
            statusCode: StatusCodes.OK,
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
const getNewAccessToken = catchAsync(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token found");
    }
    const tokenInfo = await AuthServices.getNewAccessToken(refreshToken);
    setAuthCookie(res, tokenInfo);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "New access token generated successfully",
        data: tokenInfo,
    });
});
const logout = catchAsync(async (req, res) => {
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
    let accessToken = req.headers.authorization;
    if (accessToken?.startsWith("Bearer ")) {
        accessToken = accessToken.split(" ")[1];
    }
    else {
        accessToken = req.cookies.accessToken;
    }
    if (accessToken) {
        await invalidateToken(accessToken, envVariables.JWT_ACCESS_SECRET);
    }
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                logger.error({ msg: "Session destroy error", err });
            }
        });
    }
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Logout successful",
        data: null,
    });
});
const changePassword = catchAsync(async (req, res) => {
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user;
    let accessToken = req.headers.authorization;
    if (accessToken?.startsWith("Bearer ")) {
        accessToken = accessToken.split(" ")[1];
    }
    else {
        accessToken = req.cookies.accessToken;
    }
    await AuthServices.changePassword(oldPassword, newPassword, decodedToken, accessToken);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Password changed successfully",
        data: null,
    });
});
const setPassword = catchAsync(async (req, res) => {
    const decodedToken = req.user;
    const { password } = req.body;
    await AuthServices.setPassword(decodedToken.userId, password);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Password set successfully",
        data: null,
    });
});
const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    await AuthServices.forgotPassword(email);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Email has been sent",
        data: null,
    });
});
const resetPassword = catchAsync(async (req, res) => {
    const newPassword = req.body.newPassword;
    const decodedToken = req.user;
    const resetToken = req.resetToken;
    await AuthServices.resetPassword(newPassword, decodedToken, resetToken);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Password reset successful",
        data: null,
    });
});
const googleCallback = catchAsync(async (req, res) => {
    const stateParam = req.query.state;
    let redirectTo = "";
    if (typeof stateParam === "string") {
        // Normalize backslashes and strip leading slashes for relative path
        const sanitized = stateParam.replace(/\\/g, "/").replace(/^\/+/, "");
        // Reject if it looks like an absolute URL (contains protocol)
        if (!sanitized.includes("://") &&
            !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitized)) {
            let normalizedPath = sanitized.split("?")[0];
            while (normalizedPath.length > 0 && normalizedPath.startsWith("/")) {
                normalizedPath = normalizedPath.substring(1);
            }
            while (normalizedPath.length > 0 && normalizedPath.endsWith("/")) {
                normalizedPath = normalizedPath.substring(0, normalizedPath.length - 1);
            }
            const ALLOWED_REDIRECT_PATHS = [
                "dashboard",
                "profile",
                "settings",
                "workshops",
                "enrollments",
                "payments",
                "",
            ];
            const isAllowed = ALLOWED_REDIRECT_PATHS.some((p) => normalizedPath === p || normalizedPath.startsWith(p + "/"));
            if (isAllowed) {
                redirectTo = sanitized;
            }
        }
    }
    const user = req.user;
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
    }
    const tokenInfo = await createUserTokens(user);
    setAuthCookie(res, tokenInfo);
    res.redirect(`${envVariables.FRONTEND_URL}/${redirectTo}`);
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
export default AuthControllers;
