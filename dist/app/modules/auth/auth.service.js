import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import validator from "validator";
import envVariables from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { mailQueue } from "../../jobs/mail.queue.js";
import { invalidateToken } from "../../utils/tokenBlacklist.js";
import { createNewAccessToken } from "../../utils/userTokens.js";
import { IsActive } from "../user/user.interface.js";
import User from "../user/user.model.js";
const getNewAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token found");
    }
    const tokens = await createNewAccessToken(refreshToken);
    return tokens;
};
const changePassword = async (oldPassword, newPassword, decodedToken, accessToken) => {
    const user = await User.findById(decodedToken.userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    if (oldPassword === newPassword) {
        throw new AppError(StatusCodes.BAD_REQUEST, "New password cannot be the same as the old password");
    }
    if (!user.password) {
        throw new AppError(StatusCodes.BAD_REQUEST, "No password set for this account");
    }
    const isOldPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordMatched) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid old password");
    }
    user.password = await bcrypt.hash(newPassword, Number(envVariables.BCRYPT_SALT_ROUND));
    await user.save();
    await invalidateToken(accessToken, envVariables.JWT_ACCESS_SECRET);
};
const setPassword = async (userId, plainPassword) => {
    const user = await User.findById(userId);
    if (!user)
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    if (user.password &&
        user.auths.some((providerObject) => providerObject.provider === "google")) {
        throw new AppError(StatusCodes.FORBIDDEN, "Cannot change password for Google users");
    }
    const hashedPassword = await bcrypt.hash(plainPassword, Number(envVariables.BCRYPT_SALT_ROUND));
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
    if (typeof email !== "string" ||
        email.trim().length === 0 ||
        email.length > 254 ||
        !validator.isEmail(email)) {
        return; // Silent return - don't reveal anything
    }
    const isUserExists = await User.findOne({ email: { $eq: email } });
    // Generic success message to prevent user enumeration
    if (!isUserExists ||
        !isUserExists.isVerified ||
        isUserExists.isActive === IsActive.BLOCKED ||
        isUserExists.isActive === IsActive.INACTIVE ||
        isUserExists.isDeleted) {
        return;
    }
    const jwtPayload = {
        userId: isUserExists._id,
        email: isUserExists.email,
        role: isUserExists.role,
    };
    const resetToken = jwt.sign(jwtPayload, envVariables.RESET_PASSWORD_SECRET, {
        expiresIn: "10m",
    });
    const resetUILink = `${envVariables.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await mailQueue.add("forgot-password", {
        type: "forgot-password",
        payload: {
            email: isUserExists.email,
            name: isUserExists.name,
            resetUILink,
        },
    });
};
const resetPassword = async (newPassword, decodedToken, accessToken) => {
    const user = await User.findById(decodedToken.userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    user.password = await bcrypt.hash(newPassword, Number(envVariables.BCRYPT_SALT_ROUND));
    await user.save();
    await invalidateToken(accessToken, envVariables.RESET_PASSWORD_SECRET);
};
const AuthServices = {
    getNewAccessToken,
    changePassword,
    setPassword,
    forgotPassword,
    resetPassword,
};
export default AuthServices;
