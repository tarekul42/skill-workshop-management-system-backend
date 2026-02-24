/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import sendEmail from "../../utils/sendEmail";
import { createNewAccessToken } from "../../utils/userTokens";
import { IAuthProvider, IsActive } from "../user/user.interface";
import User from "../user/user.model";

const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token found");
  }

  const newAccessToken = await createNewAccessToken(refreshToken);
  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
) => {
  const user = await User.findById(decodedToken.userId);

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

  user!.password = await bcrypt.hash(
    newPassword,
    Number(envVariables.BCRYPT_SALT_ROUND),
  );

  await user!.save();
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  if (
    user.password &&
    user.auths.some((providerObject) => providerObject.provider === "google")
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Cannot change password for Google users",
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
  if (typeof email !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email");
  }

  const isUserExists = await User.findOne({ email: { $eq: email } });

  if (!isUserExists) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!isUserExists.isVerified) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is not verified");
  }

  if (
    isUserExists.isActive === IsActive.BLOCKED ||
    isUserExists.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is blocked or inactive");
  }

  if (isUserExists.isDeleted) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExists._id,
    email: isUserExists.email,
    role: isUserExists.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVariables.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });

  const resetUILink = `${envVariables.FRONTEND_URL}/reset-password?id=${isUserExists._id}&token=${resetToken}`;

  await sendEmail({
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
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
) => {
  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (oldPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password cannot be the same as the old password",
    );
  }

  const isOldPasswordMatched = await bcrypt.compare(
    oldPassword,
    user.password as string,
  );

  if (!isOldPasswordMatched) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Old password does not match");
  }

  user.password = await bcrypt.hash(
    newPassword,
    Number(envVariables.BCRYPT_SALT_ROUND),
  );

  user.save();
};

const AuthServices = {
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
};

export default AuthServices;
