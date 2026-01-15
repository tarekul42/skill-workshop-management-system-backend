import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt";
import envVariables from "../config/env";
import { JwtPayload } from "jsonwebtoken";

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
