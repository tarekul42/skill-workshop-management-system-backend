import { StatusCodes } from "http-status-codes";
import { IUser } from "../user/user.interface";
import User from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import bcrypt from "bcryptjs";
import { createNewAccessToken, createUserTokens } from "../../utils/userTokens";

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
  const newAccessToken = await createNewAccessToken(refreshToken);
  return {
    accessToken: newAccessToken,
  };
};

const AuthServices = {
  credentialsLogin,
  getNewAccessToken,
};

export default AuthServices;
