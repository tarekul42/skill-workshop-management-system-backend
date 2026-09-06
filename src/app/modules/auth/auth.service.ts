import bcrypt from "bcryptjs";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import validator from "validator";
import envVariables from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { sendEmailDirect } from "../../utils/sendEmailDirect.js";
import { invalidateToken } from "../../utils/tokenBlacklist.js";
import {
  createNewAccessToken,
  revokeAllRefreshTokens,
} from "../../utils/userTokens.js";
import { IAuthProvider, IsActive } from "../user/user.interface.js";
import User from "../user/user.model.js";

const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token found");
  }

  const tokens = await createNewAccessToken(refreshToken);
  return tokens;
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
  accessToken: string,
) => {
  const user = await User.findOne({ _id: { $eq: decodedToken.userId } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (oldPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password cannot be the same as the old password",
    );
  }

  if (!user.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "No password set for this account",
    );
  }

  const isOldPasswordMatched = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordMatched) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid old password");
  }

  user.password = await bcrypt.hash(
    newPassword,
    Number(envVariables.BCRYPT_SALT_ROUND),
  );

  await user.save();

  await invalidateToken(accessToken, envVariables.JWT_ACCESS_SECRET);

  // Invalidate ALL refresh sessions so other devices can't generate new access tokens
  await revokeAllRefreshTokens(decodedToken.userId as string);
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findOne({ _id: { $eq: userId } });

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  // If the user already has a password, they must use changePassword()
  // which verifies the old password first. setPassword is only for users
  // who have never set a password (e.g., Google users creating one for
  // the first time, or registration flows that skipped password).
  if (user.password) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Password already set. Use change password to update it.",
    );
  }

  const hashedPassword = await bcrypt.hash(
    plainPassword,
    Number(envVariables.BCRYPT_SALT_ROUND),
  );

  const credentialProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email,
  };

  const hasCredentials = user.auths.some(
    (providerObject) => providerObject.provider === "credentials",
  );
  const auths: IAuthProvider[] = hasCredentials
    ? user.auths
    : [...user.auths, credentialProvider];

  user.password = hashedPassword;

  user.auths = auths;

  await user.save();
};
const forgotPassword = async (email: string) => {
  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    email.length > 254 ||
    !validator.isEmail(email)
  ) {
    return; // Silent return - don't reveal anything
  }

  const isUserExists = await User.findOne({ email: { $eq: email } });

  // Generic success message to prevent user enumeration
  if (
    !isUserExists ||
    !isUserExists.isVerified ||
    isUserExists.isActive === IsActive.BLOCKED ||
    isUserExists.isActive === IsActive.INACTIVE ||
    isUserExists.isDeleted
  ) {
    return;
  }

  const jwtPayload = {
    userId: isUserExists._id,
    email: isUserExists.email,
    role: isUserExists.role,
    jti: crypto.randomUUID(),
  };

  const resetToken = jwt.sign(jwtPayload, envVariables.RESET_PASSWORD_SECRET, {
    expiresIn: "10m",
  });

  const resetUILink = `${envVariables.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await sendEmailDirect({
    to: isUserExists.email,
    subject: "Password Reset",
    templateName: "forgetPassword",
    templateData: {
      name: isUserExists.name,
      resetUILink,
    },
  });
};

const resetPassword = async (
  newPassword: string,
  decodedToken: JwtPayload,
  accessToken: string,
) => {
  const user = await User.findOne({ _id: { $eq: decodedToken.userId } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  user.password = await bcrypt.hash(
    newPassword,
    Number(envVariables.BCRYPT_SALT_ROUND),
  );

  await user.save();

  await invalidateToken(accessToken, envVariables.RESET_PASSWORD_SECRET);

  // Invalidate ALL refresh sessions to force re-authentication after password reset
  await revokeAllRefreshTokens(decodedToken.userId as string);
};

const AuthServices = {
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
};

export default AuthServices;
