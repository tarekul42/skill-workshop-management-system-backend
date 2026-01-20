import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt";
import envVariables from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import User from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";

const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;

      if (!accessToken) {
        throw new AppError(StatusCodes.FORBIDDEN, "Access token is missing");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVariables.JWT_ACCESS_SECRET,
      ) as JwtPayload;

      if (!verifiedToken) {
        throw new AppError(StatusCodes.FORBIDDEN, "Invalid access token");
      }

      const isUserExists = await User.findOne({ email: verifiedToken.email });

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

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, "Access denied");
      }

      req.user = verifiedToken;

      next();
    } catch (err) {
      next(err);
    }
  };

export default checkAuth;
