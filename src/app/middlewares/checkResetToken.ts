import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive } from "../modules/user/user.interface";
import { verifyToken } from "../utils/jwt";
import { isTokenBlacklisted } from "../utils/tokenBlacklist";

/**
 * Middleware to verify password reset tokens using the dedicated RESET_PASSWORD_SECRET.
 * Also checks for user status and token blacklisting.
 */
const checkResetToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const User = mongoose.model("User");
    let resetToken = req.headers.authorization;

    if (!resetToken && req.body.token) {
      resetToken = req.body.token;
    }

    if (!resetToken) {
      throw new AppError(StatusCodes.FORBIDDEN, "Reset token is missing");
    }

    if (resetToken.startsWith("Bearer ")) {
      const parts = resetToken.split(" ");
      if (parts.length !== 2 || !parts[1]) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Malformed authorization header");
      }
      resetToken = parts[1];
    }

    const verifiedToken = verifyToken(
      resetToken,
      envVariables.RESET_PASSWORD_SECRET,
    ) as JwtPayload;

    if (!verifiedToken) {
      throw new AppError(StatusCodes.FORBIDDEN, "Invalid reset token");
    }

    const blacklisted = await isTokenBlacklisted(resetToken);
    if (blacklisted) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Token has already been used or invalidated",
      );
    }

    const isUserExists = await User.findById(verifiedToken.userId);

    if (!isUserExists) {
      throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
    }

    if (!isUserExists.isVerified) {
      throw new AppError(StatusCodes.FORBIDDEN, "User is not verified");
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

    // Populate req.user for the controller
    req.user = verifiedToken;
    req.resetToken = resetToken;

    next();
  } catch (err) {
    next(err);
  }
};

export default checkResetToken;
