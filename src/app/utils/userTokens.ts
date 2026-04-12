import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import envVariables from "../config/env.js";
import { redisClient } from "../config/redis.config.js";
import AppError from "../errorHelpers/AppError.js";
import { IsActive, IUser } from "../modules/user/user.interface.js";
import User from "../modules/user/user.model.js";
import { generateToken, verifyToken } from "./jwt.js";
import logger from "./logger.js";
import { parseExpiryToSeconds } from "./parseExpiry.js";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createUserTokens = async (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVariables.JWT_ACCESS_SECRET,
    envVariables.JWT_ACCESS_EXPIRES,
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVariables.JWT_REFRESH_SECRET,
    envVariables.JWT_REFRESH_EXPIRES,
  );

  const hashedToken = hashToken(refreshToken);
  try {
    await redisClient.set(`refresh_token:${user._id}`, hashedToken, {
      EX: parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES),
    });
  } catch (error) {
    logger.error({
      msg: "Redis unavailable — refresh token not stored",
      err: error,
    });
  }

  return { accessToken, refreshToken };
};

const createNewAccessToken = async (refreshToken: string) => {
  const verifiedPayload = verifyToken(
    refreshToken,
    envVariables.JWT_REFRESH_SECRET,
  );

  const userId = verifiedPayload.userId as string;
  let storedHashedToken: string | null;
  try {
    storedHashedToken = await redisClient.get(`refresh_token:${userId}`);
  } catch (error) {
    logger.error({
      msg: "Redis unavailable — cannot verify refresh token",
      err: error,
    });
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Authentication service temporarily unavailable",
    );
  }

  if (!storedHashedToken || storedHashedToken !== hashToken(refreshToken)) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  try {
    await redisClient.del(`refresh_token:${userId}`);
  } catch (error) {
    logger.error({
      msg: "Redis unavailable — cannot delete old refresh token",
      err: error,
    });
  }

  const isUserExists = await User.findOne({ email: verifiedPayload.email });

  if (!isUserExists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  if (
    isUserExists.isActive === IsActive.INACTIVE ||
    isUserExists.isActive === IsActive.BLOCKED
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `User is ${isUserExists.isActive.toLowerCase()}.`,
    );
  }

  if (isUserExists.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExists._id,
    email: isUserExists.email,
    role: isUserExists.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVariables.JWT_ACCESS_SECRET,
    envVariables.JWT_ACCESS_EXPIRES,
  );

  const newRefreshToken = generateToken(
    jwtPayload,
    envVariables.JWT_REFRESH_SECRET,
    envVariables.JWT_REFRESH_EXPIRES,
  );

  const hashedNewToken = hashToken(newRefreshToken);
  try {
    await redisClient.set(`refresh_token:${userId}`, hashedNewToken, {
      EX: parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES),
    });
  } catch (error) {
    logger.error({
      msg: "Redis unavailable — new refresh token not stored",
      err: error,
    });
  }

  return { accessToken, refreshToken: newRefreshToken };
};

export { createNewAccessToken, createUserTokens };
