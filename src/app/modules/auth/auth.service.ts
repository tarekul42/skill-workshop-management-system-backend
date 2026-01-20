import { StatusCodes } from "http-status-codes";
import { IUser } from "../user/user.interface";
import User from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import bcrypt from "bcryptjs";
import { createNewAccessToken, createUserTokens } from "../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";
import envVariables from "../../config/env";

const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  const isUserExists = await User.findOne({ email: { $eq: email } });

  if (!isUserExists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Valid password is required");
  }

  if (!isUserExists.password) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User password not found");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    isUserExists.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password does not match");
  }

  const userTokens = createUserTokens(isUserExists);

  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: isUserExists,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token found");
  }

  const newAccessToken = await createNewAccessToken(refreshToken);
  return {
    accessToken: newAccessToken,
  };
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
  credentialsLogin,
  getNewAccessToken,
  resetPassword,
};

export default AuthServices;
